# Smart Manure Monitoring and Crop Suitability Prediction

A smart agriculture project for monitoring manure composition and predicting crop suitability.

## Features

- Manure composition monitoring
- Crop suitability prediction
- Backend API and frontend interface
- Agricultural data processing and machine learning
- ESP32 firmware support

## Prerequisites

- Node.js and npm
- Python 3
- Git

## Run Locally

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Start the frontend

```bash
npm run dev
```

### 3. Set up the Python backend

```bash
cd backend
pip install -r requirements.txt
```

Start the backend using the instructions in the backend documentation or `backend/app/main.py`.

## Project Structure

- `backend/` — Python backend and API
- `data/` — Agricultural datasets and model data
- `database/` — Database-related files
- `docs/` — Project documentation
- `firmware/` — ESP32 firmware
- `src/` — Frontend source code
- `tests/` — Test files

## Notes

Configure environment variables using `.env.example` where required. Never commit API keys, passwords, or other secrets.