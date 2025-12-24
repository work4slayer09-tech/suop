# SUOP — Desktop (Electron) — Full repo (updated)

This repo is prepared to run locally, with Docker, deploy backend on Render / Railway, and package Electron with the backend embedded.

Key features added:
- Embedded backend runner for packaged Electron (main.js spawns backend in production)
- docker-compose for local dev (MongoDB + backend)
- Dockerfile for backend
- API route /api/users and /api/users/me for DM list and profile
- Frontend enhanced with Direct Messages list, presence, and profile modal
- electron-builder config in root package.json with extraResources to include backend files

Quick local dev (no Docker)
1. Copy backend/.env.example -> backend/.env and set MONGO_URI and JWT_SECRET.
2. From repo root:
   npm run install:all
   npm run dev
   This starts the backend and launches Electron.

Quick local dev with Docker
1. Copy backend/.env.example -> backend/.env (optional for local testing)
2. From repo root:
   docker-compose up --build
   This starts MongoDB and backend. Then open the Electron app via:
   npx electron .

Deploying backend to Render / Railway
- On Render / Railway create a new Web Service pointing at the `backend` folder (or whole repo and set the build/start commands).
- Set environment variables:
  - MONGO_URI (your Atlas connection string)
  - JWT_SECRET (secure random string)
  - PORT (optional)
- Start command: `npm start`
- Socket.IO requires WebSocket support (both Render and Railway support websockets by default).
- Use the remote URL for the frontend (or point packaged Electron at that remote URL).

Packaging single-exe (bundled backend)
- Put your icons in `build/icon.ico` (Windows) and update productName/publisher in package.json.
- Build: `npm run dist`
- The produced installer will include the backend in extraResources and the packaged app will spawn backend using the bundled runtime when installed.

Signing & icons
- Code signing requires certs provided to electron-builder (not included here).
- In package.json build config you can add signing options for macOS (entitlements), Windows (certificateFile, certificatePassword), etc. See electron-builder docs: https://www.electron.build/

Security
- Use a strong JWT_SECRET.
- Use TLS (HTTPS / WSS) in production.
- Replace local storage token usage with a more secure OS store if shipping widely.

What I did not include (you should add)
- Replacement icons (build/icon.ico, build/icon.icns) — provide your own artwork.
- Code signing credentials — must be provided by you for real signed installers.

What to run now
1. Set up backend env:
   - cp backend/.env.example backend/.env
   - Edit backend/.env: set MONGO_URI and JWT_SECRET
2. Install:
   - From repo root: npm run install:all
3. Start dev:
   - npm run dev
   - The backend will be available on http://localhost:3000 and Electron GUI will open.

If you want, I can add CI workflows or helper scripts. Please confirm and I will push any further changes.
