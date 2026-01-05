# Vocacity AI Calling Platform

A professional, "Code-Only" SaaS platform for automated AI voice campaigns.

## System Architecture

The project is organized into two isolated components:

1.  **`backend/` (Python Logic)**
    *   **`server.py`**: Flask API that handles the Dashboard, File Uploads, and Webhooks.
    *   **`observer.py`**: The "Heartbeat" script that monitors the DB and triggers calls.
    *   **`database.py`**: SQLite database manager (No external database required).
    *   **`voca.db`**: Local database file (Created automatically).

2.  **`voca-dashboard/` (Frontend UI)**
    *   **React + Vite**: High-performance single-page application.
    *   **TailwindCSS**: Professional dark-mode UI.
    *   **Live Connectivity**: Polls the backend every 3 seconds for real-time updates.

---

## Quick Start Guide

### 1. Start the Backend
You need **two** terminal processes for the backend to work fully.

**Terminal 1 (The API Server)**
```powershell
cd backend
python server.py
# Runs on http://localhost:5000
```

**Terminal 2 (The Call Trigger)**
```powershell
cd backend
python observer.py
# Monitors for "Ready" leads and executes calls
```

### 2. Start the Dashboard
**Terminal 3 (The Frontend)**
```powershell
cd voca-dashboard
npm run dev
# Opens http://localhost:5173
```

---

## How to Use "Vocacity"

1.  **Open the Dashboard**: Go to `http://localhost:5173`.
2.  **Upload Info**: Drag & Drop your CSV file (`Name, Phone`).
3.  **Monitor**: The leads appear as "Pending".
4.  **Launch**: Click **Start Campaign**.
5.  **Watch Live**:
    *   Status changes to `Ready` -> `Calling`.
    *   See the "Live Call Logs" update in real-time.
    *   When the call ends, the **Sentiment** and **Summary** will auto-populate.

---

## Configuration

*   **API Keys**: stored in `backend/.env`.
*   **Database**: `backend/voca.db` (Auto-generated).
