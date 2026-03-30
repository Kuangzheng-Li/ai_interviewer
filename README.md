# AI Interviewer

A real-time AI interviewer powered by the Gemini Live API. It conducts adaptive screening interviews for frontline and hourly roles using voice conversation.

Built with a **FastAPI** backend and a **vanilla JS** frontend — no build step required.

## Features

- **Voice Interview** — Real-time bi-directional audio conversation with Gemini
- **Configurable Voice** — Choose from multiple voices (Charon, Puck, Fenrir, Kore, Aoede, etc.)
- **Accent & Pace Control** — Select accent (American, British, Irish, etc.), speech speed, language, and tone
- **Resume-Aware** — The interviewer references the candidate's resume and adapts questions accordingly
- **Customizable Prompt** — Edit the system prompt and welcome message in `prompt.md`
- **Camera / Screen Sharing** — Optional video input for multimodal context
- **Live Transcription** — See both user and AI transcriptions in real time

## Quick Start

### 1. Set up your API key

Copy the example env file and add your [Google AI Studio](https://aistudio.google.com/) API key:

```bash
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here
```

### 2. Install dependencies and run

```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
uv run main.py
```

### 3. Open in browser

Go to [http://localhost:8000](http://localhost:8000), configure voice settings, and click **Start Interview**.

## Project Structure

```
ai-interviewer/
├── main.py              # FastAPI server & WebSocket endpoint
├── gemini_live.py       # Gemini Live API session wrapper
├── prompt.md            # Interview system prompt & welcome message
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variable template
└── frontend/
    ├── index.html       # UI with config panel
    ├── main.js          # Application logic
    ├── gemini-client.js # WebSocket client
    ├── media-handler.js # Audio/Video capture and playback
    ├── pcm-processor.js # AudioWorklet for PCM processing
    └── style.css        # Styles
```

## Customizing the Interview

Edit `prompt.md` to change the interview behavior. The file has two sections separated by `## WELCOME_MESSAGE`:

- **Everything above** — The system prompt (role, style, job description, candidate resume, etc.)
- **Everything below** — The opening greeting the AI will speak when the interview starts

The candidate name entered in the UI will automatically replace the default name in the prompt.

## Configuration Options

| Setting   | Options                                                            |
|-----------|--------------------------------------------------------------------|
| Voice     | Charon, Puck, Fenrir, Orus, Perseus (Male) / Kore, Aoede, Leda (Female) |
| Accent    | Default, American, British, Australian, Irish, Indian, Southern, New York |
| Speed     | Normal, Slow, Fast                                                 |
| Language  | English, Chinese, Spanish, French, Japanese, Korean, German, Portuguese |
| Tone      | Neutral, Friendly, Professional, Casual, Enthusiastic              |

## License

MIT
