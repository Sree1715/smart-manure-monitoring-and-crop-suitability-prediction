# Smart Manure Monitor — Frontend

React (Vite) + Tailwind CSS frontend for the **Smart Manure Monitoring & Crop Suitability
Predictor** (GOBARdhan · SIH1767).

This is the **project foundation**: routing, layout, reusable UI components, and polished
placeholder pages. AI logic, Streamlit analytics, and ESP32 integration are not part of this step.

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Axios (API client, ready for backend wiring)
- Chart.js / react-chartjs-2 (installed, ready for real charts)
- Lucide React icons

## Requirements
- Node.js 18+ and npm 9+ (check with `node -v` and `npm -v`)

## 1. Install dependencies
```bash
cd frontend
npm install
```

## 2. Configure environment (optional)
```bash
cp .env.example .env
```
Edit `.env` if your backend runs somewhere other than `http://localhost:8000/api`.

## 3. Run the dev server
```bash
npm run dev
```
Opens at **http://localhost:5173**

## 4. Build for production
```bash
npm run build
npm run preview
```

## Opening in VS Code
```bash
code .
```
Recommended extensions: **ESLint**, **Tailwind CSS IntelliSense**, **ES7+ React snippets**.

## Opening in Antigravity / any IDE
This is a standard Vite project — open the `frontend/` folder as the workspace root, run
`npm install` then `npm run dev` in its integrated terminal. No special configuration needed.

## Folder Structure
```
frontend/
├── public/
├── src/
│   ├── components/     # Navbar, Footer, Button, Card, Input
│   ├── layouts/         # MainLayout (Navbar + Footer wrapper)
│   ├── pages/            # Home, Login, Register, Dashboards, Prediction, Reports, Settings, Contact
│   ├── hooks/            # useAuth, useMediaQuery (placeholders)
│   ├── services/         # api.js (axios instance), authService.js (placeholder)
│   ├── utils/             # constants.js, formatters.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

## Pages Included
| Route | Page |
|---|---|
| `/` | Home |
| `/farmer-login` | Farmer Login |
| `/authority-login` | Authority Login |
| `/register` | Register (farmer/authority toggle) |
| `/farmer-dashboard` | Farmer Dashboard |
| `/authority-dashboard` | Authority Dashboard |
| `/crop-prediction` | Crop Prediction form |
| `/reports` | Reports |
| `/settings` | Settings |
| `/contact` | Contact |

## Next Steps (not in this build)
- Wire `services/authService.js` and `services/api.js` to the FastAPI backend
- Connect JWT auth flow to `hooks/useAuth.js`
- Replace chart placeholders with real Chart.js data
- Connect Crop Prediction form to the Random Forest model endpoint
- ESP32 device onboarding UI
