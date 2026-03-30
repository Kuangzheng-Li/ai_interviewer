// --- Main Application Logic ---

const statusDiv = document.getElementById("status");
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const sessionEndSection = document.getElementById("session-end-section");
const restartBtn = document.getElementById("restartBtn");
const micBtn = document.getElementById("micBtn");
const cameraBtn = document.getElementById("cameraBtn");
const screenBtn = document.getElementById("screenBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const textInput = document.getElementById("textInput");
const sendBtn = document.getElementById("sendBtn");
const videoPreview = document.getElementById("video-preview");
const videoPlaceholder = document.getElementById("video-placeholder");
const connectBtn = document.getElementById("connectBtn");
const chatLog = document.getElementById("chat-log");
const voiceSelect = document.getElementById("voiceSelect");
const systemPrompt = document.getElementById("systemPrompt");
const accentSelect = document.getElementById("accentSelect");
const paceSelect = document.getElementById("paceSelect");
const languageSelect = document.getElementById("languageSelect");
const toneSelect = document.getElementById("toneSelect");
const candidateNameInput = document.getElementById("candidateName");
const welcomeMessageInput = document.getElementById("welcomeMessage");

let currentGeminiMessageDiv = null;
let currentUserMessageDiv = null;
let defaultCandidateName = "Steven";

(async function loadDefaultConfig() {
  try {
    const res = await fetch("/api/config");
    const config = await res.json();
    if (config.system_instruction) {
      systemPrompt.value = config.system_instruction;
    }
    if (config.welcome_message) {
      welcomeMessageInput.value = config.welcome_message;
    }
  } catch (e) {
    console.warn("Could not load default config:", e);
  }
})();

const mediaHandler = new MediaHandler();
const geminiClient = new GeminiClient({
  onOpen: () => {
    statusDiv.textContent = "Connected";
    statusDiv.className = "status connected";
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    geminiClient.sendText(".");
  },
  onMessage: (event) => {
    if (typeof event.data === "string") {
      try {
        const msg = JSON.parse(event.data);
        handleJsonMessage(msg);
      } catch (e) {
        console.error("Parse error:", e);
      }
    } else {
      mediaHandler.playAudio(event.data);
    }
  },
  onClose: (e) => {
    console.log("WS Closed:", e);
    statusDiv.textContent = "Disconnected";
    statusDiv.className = "status disconnected";
    showSessionEnd();
  },
  onError: (e) => {
    console.error("WS Error:", e);
    statusDiv.textContent = "Connection Error";
    statusDiv.className = "status error";
  },
});

function handleJsonMessage(msg) {
  if (msg.type === "end_call") {
    waitForAudioThenDisconnect();
    return;
  } else if (msg.type === "interrupted") {
    mediaHandler.stopAudioPlayback();
    currentGeminiMessageDiv = null;
    currentUserMessageDiv = null;
  } else if (msg.type === "turn_complete") {
    currentGeminiMessageDiv = null;
    currentUserMessageDiv = null;
  } else if (msg.type === "user") {
    if (currentUserMessageDiv) {
      currentUserMessageDiv.textContent += msg.text;
      chatLog.scrollTop = chatLog.scrollHeight;
    } else {
      currentUserMessageDiv = appendMessage("user", msg.text);
    }
  } else if (msg.type === "gemini") {
    if (currentGeminiMessageDiv) {
      currentGeminiMessageDiv.textContent += msg.text;
      chatLog.scrollTop = chatLog.scrollHeight;
    } else {
      currentGeminiMessageDiv = appendMessage("gemini", msg.text);
    }
  }
}

function appendMessage(type, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${type}`;
  msgDiv.textContent = text;
  chatLog.appendChild(msgDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
  return msgDiv;
}

function replaceName(text, newName) {
  if (!newName || newName === defaultCandidateName) return text;
  return text.replaceAll(defaultCandidateName, newName);
}

function buildSystemInstruction() {
  const name = candidateNameInput.value.trim() || defaultCandidateName;
  let instruction = replaceName(systemPrompt.value, name);

  const voiceParts = [];
  if (accentSelect.value) {
    voiceParts.push(`Speak in a ${accentSelect.value} accent.`);
  }
  if (paceSelect.value === "slow") {
    voiceParts.push("Speak slowly and clearly, with deliberate pacing.");
  } else if (paceSelect.value === "fast") {
    voiceParts.push("Speak at a brisk, fast pace.");
  }
  if (languageSelect.value) {
    voiceParts.push(`Speak in ${languageSelect.value}.`);
  }
  if (toneSelect.value) {
    voiceParts.push(`Use a ${toneSelect.value} tone.`);
  }
  if (voiceParts.length > 0) {
    instruction += "\n\n## Voice Style\n" + voiceParts.join("\n");
  }

  const welcomeText = welcomeMessageInput.value.trim();
  if (welcomeText) {
    const welcome = replaceName(welcomeText, name);
    instruction +=
      "\n\n## Opening Message\n" +
      "When the conversation starts, immediately greet the candidate by saying the following (you may rephrase slightly to sound natural):\n\n" +
      welcome;
  }

  return instruction;
}

connectBtn.onclick = async () => {
  statusDiv.textContent = "Connecting...";
  connectBtn.disabled = true;

  try {
    await mediaHandler.initializeAudio();
    geminiClient.connect({
      voice_name: voiceSelect.value,
      system_instruction: buildSystemInstruction(),
    });
  } catch (error) {
    console.error("Connection error:", error);
    statusDiv.textContent = "Connection Failed: " + error.message;
    statusDiv.className = "status error";
    connectBtn.disabled = false;
  }
};

disconnectBtn.onclick = () => {
  waitForAudioThenDisconnect();
};

micBtn.onclick = async () => {
  if (mediaHandler.isRecording) {
    mediaHandler.stopAudio();
    micBtn.textContent = "Start Mic";
  } else {
    try {
      await mediaHandler.startAudio((data) => {
        if (geminiClient.isConnected()) {
          geminiClient.send(data);
        }
      });
      micBtn.textContent = "Stop Mic";
    } catch (e) {
      alert("Could not start audio capture");
    }
  }
};

cameraBtn.onclick = async () => {
  if (cameraBtn.textContent === "Stop Camera") {
    mediaHandler.stopVideo(videoPreview);
    cameraBtn.textContent = "Start Camera";
    screenBtn.textContent = "Share Screen";
    videoPlaceholder.classList.remove("hidden");
  } else {
    if (mediaHandler.videoStream) {
      mediaHandler.stopVideo(videoPreview);
      screenBtn.textContent = "Share Screen";
    }
    try {
      await mediaHandler.startVideo(videoPreview, (base64Data) => {
        if (geminiClient.isConnected()) {
          geminiClient.sendImage(base64Data);
        }
      });
      cameraBtn.textContent = "Stop Camera";
      screenBtn.textContent = "Share Screen";
      videoPlaceholder.classList.add("hidden");
    } catch (e) {
      alert("Could not access camera");
    }
  }
};

screenBtn.onclick = async () => {
  if (screenBtn.textContent === "Stop Sharing") {
    mediaHandler.stopVideo(videoPreview);
    screenBtn.textContent = "Share Screen";
    cameraBtn.textContent = "Start Camera";
    videoPlaceholder.classList.remove("hidden");
  } else {
    if (mediaHandler.videoStream) {
      mediaHandler.stopVideo(videoPreview);
      cameraBtn.textContent = "Start Camera";
    }
    try {
      await mediaHandler.startScreen(
        videoPreview,
        (base64Data) => {
          if (geminiClient.isConnected()) {
            geminiClient.sendImage(base64Data);
          }
        },
        () => {
          screenBtn.textContent = "Share Screen";
          videoPlaceholder.classList.remove("hidden");
        }
      );
      screenBtn.textContent = "Stop Sharing";
      cameraBtn.textContent = "Start Camera";
      videoPlaceholder.classList.add("hidden");
    } catch (e) {
      alert("Could not share screen");
    }
  }
};

sendBtn.onclick = sendText;
textInput.onkeypress = (e) => {
  if (e.key === "Enter") sendText();
};

function sendText() {
  const text = textInput.value;
  if (text && geminiClient.isConnected()) {
    geminiClient.sendText(text);
    appendMessage("user", text);
    textInput.value = "";
  }
}

function waitForAudioThenDisconnect() {
  const poll = setInterval(() => {
    const allDone =
      mediaHandler.scheduledSources.length === 0 ||
      (mediaHandler.audioContext &&
        mediaHandler.audioContext.currentTime >= mediaHandler.nextStartTime);
    if (allDone) {
      clearInterval(poll);
      geminiClient.disconnect();
    }
  }, 200);
}

function resetUI() {
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
  sessionEndSection.classList.add("hidden");
  mediaHandler.stopAudio();
  mediaHandler.stopVideo(videoPreview);
  videoPlaceholder.classList.remove("hidden");
  micBtn.textContent = "Start Mic";
  cameraBtn.textContent = "Start Camera";
  screenBtn.textContent = "Share Screen";
  chatLog.innerHTML = "";
  connectBtn.disabled = false;
}

function showSessionEnd() {
  appSection.classList.add("hidden");
  sessionEndSection.classList.remove("hidden");
  mediaHandler.stopAudio();
  mediaHandler.stopVideo(videoPreview);
}

restartBtn.onclick = () => {
  resetUI();
};
