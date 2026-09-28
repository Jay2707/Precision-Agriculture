# Precision Agriculture — Crop Disease Detection

An AI-powered web application that detects crop diseases from leaf images using deep learning, and gives farmers actionable remedy suggestions.

**Project Exhibition – I (DSN2098)** · B.Tech AI-ML · School of Computing Science Engineering & AI, VIT Bhopal · Academic Year 2026–2027

## Team — Group 235

| Name | Registration No. |
|---|---|
| Shreyansh Nandan Shukla | 25BAI10310 |
| Sankil Sudrik | 25BAI10311 |
| Jay Prajapati | 25BAI10350 |
| Rajat Kumar Meher | 25BAI11136 |
| Ankesh Raj | 25BAI11393 |
| Aryan Rai | 25BAI10726 |

**Supervisor:** Dr. A. Sirajudeen — Department of CSE (AI & ML), School of Computer Science & AI (SCAI)

## Features

- Image-based crop disease detection
- Remedy / treatment suggestions
- Data visualizer (crop health, weather, seasonal trends)
- Voice-enabled assistant
- Community discussion board
- Multi-language support (i18next)

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, Framer Motion, React Router
- **Backend:** Node.js + Express
- **Database:** MySQL
- **Auth:** bcrypt password hashing
- **Email:** Nodemailer (Gmail)

## Project Structure

```
├── src/
│   ├── components/       # ImageAnalysis, DataVisualizer, VoiceAssistant, MenuBar
│   ├── pages/             # Welcome, SignIn, SignUp, Community
│   ├── App.tsx
│   └── main.tsx
├── server.cjs              # Express backend (auth, posts, comments)
├── .env.example             # Environment variable template
└── package.json
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in your own values (database credentials, email app password, API keys). **Never commit your real `.env` file.**
```bash
cp .env.example .env
```

### 3. Set up the database
Create a MySQL database matching `DB_NAME` in your `.env`, with `users`, `posts`, and `comments` tables (see schema notes below).

### 4. Run the app
```bash
npm run dev
```
This starts the backend (`server.cjs`) on port 5000 and the Vite frontend on port 5173 concurrently.

## Environment Variables Required

See `.env.example` for the full list. You will need:
- MySQL connection details
- A Gmail address + [App Password](https://myaccount.google.com/apppasswords) for the welcome email
- An OpenWeatherMap API key (free tier) for the data visualizer
- A Plant.id API key (free tier) for image-based disease identification

## Notes on This Codebase

This project was adapted from an open-source reference implementation shared with the team, then modified for our own use:
- Backend auth rewritten to hash passwords with bcrypt instead of storing them in plaintext
- All hardcoded credentials and API keys removed and replaced with environment variables
- Duplicate/dead routes removed
- Rebranded for our project title and team

## License

For academic use as part of DSN2098 Project Exhibition – I, VIT Bhopal.
