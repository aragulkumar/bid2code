# BIT2CODE — Netlify & Firebase 24/7 Deployment Guide

This guide explains how to deploy the frontend to **Netlify** (100% free, always online) and collect participant registrations **24/7 in Firebase Firestore**, so participants can register anytime even when your personal laptop is turned off.

---

## 🏗️ Architecture

```text
Any Participant (Mobile / Laptop)
             ↓ 24/7 Online
Netlify Frontend (https://bit2code-2026.netlify.app)
             ↓
Firebase Firestore (Free Cloud Database)
   - Stores Participant Details
   - Automatically Credits 1,000 Points
             ↓ (On Event Day)
Organizer Laptop / Backend (sync_firebase_participants)
```

---

## 🌟 Part 1: Setup Free Firebase Project (3 Minutes)

1. Go to **[Firebase Console](https://console.firebase.google.com/)** and click **"Add project"**.
2. Name your project (e.g. `bit2code-2026`).
3. In the project dashboard:
   - Click **Firestore Database** in the left menu → Click **"Create database"**.
   - Select **Start in test mode** (or allow read/write for `participants` collection).
   - Click **Next** and choose a location (e.g., `asia-south1` or `us-central1`).
4. Click the **Web icon `</>`** (Register app) to get your Firebase configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "bit2code-2026.firebaseapp.com",
     projectId: "bit2code-2026",
     storageBucket: "bit2code-2026.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

---

## 🚀 Part 2: Deploy Frontend to Netlify in 2 Minutes

### Option A: Connect via GitHub (Automatic Updates)

1. Go to **[Netlify](https://app.netlify.com/)** and log in with your GitHub account.
2. Click **"Add new site"** → **"Import an existing project"**.
3. Select **GitHub** and choose your repository: **`aragulkumar/bid2code`**.
4. Netlify will automatically detect settings from [netlify.toml](file:///r:/Projects/bid2code/netlify.toml):
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **"Environment variables"** (or add under *Site configuration → Environment variables*):
   ```text
   VITE_FIREBASE_API_KEY = your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN = bit2code-2026.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID = bit2code-2026
   VITE_FIREBASE_STORAGE_BUCKET = bit2code-2026.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
   VITE_FIREBASE_APP_ID = your_app_id
   ```
6. Click **"Deploy site"**.
7. In ~30 seconds, Netlify will give you a live URL (e.g., `https://bit2code-2026.netlify.app`)!

---

## 📥 Part 3: Sync Participants to Django on Event Day

Whenever you start your Django backend on event day (29 September 2026), run the sync command to import all participants registered via Firebase:

```powershell
python backend/manage.py sync_firebase_participants --project-id bit2code-2026
```

All participants will be imported into PostgreSQL with their exact starting balance of **1,000 points** and assigned their anonymous IDs (`P01`, `P02`, etc.) ready for the live auction!
