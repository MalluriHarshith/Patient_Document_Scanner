# 🚀 Deploying HealthCare-AI on Render

This guide outlines how to deploy your **Healthcare AI Assistant** on [Render](https://render.com) for free.

---

## ⚡ Method 1: 1-Click Blueprint Deployment (Recommended)

The repository includes a `render.yaml` Blueprint that configures the entire stack automatically.

1. Push your repository to **GitHub** or **GitLab**.
2. Go to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository (`HealthCare-AI`).
5. Render will automatically detect `render.yaml`.
6. Fill in the required Environment Variables in the Render UI:
   - `MONGODB_URI`: `mongodb+srv://m4upgraded124_db_user:AfBUzFVEZ45KKh3g@healthcarecluster.k0nyyfn.mongodb.net/healthcare_db?appName=HealthcareCluster`
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key from Google AI Studio)*
   - `DATABASE_NAME`: `healthcare_db`
7. Click **Apply**. Render will build and deploy the entire application!

---

## 🛠️ Method 2: Manual Web Service Setup (Single Full-Stack Service)

Deploy frontend and backend together under a single Render Web Service:

1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `healthcare-ai`
   - **Language**: `Python`
   - **Branch**: `main` (or your current branch)
   - **Build Command**:
     ```bash
     cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: `Free`

4. Add **Environment Variables** in the Environment tab:
   | Key | Value |
   |---|---|
   | `PYTHON_VERSION` | `3.11.9` |
   | `MONGODB_URI` | `mongodb+srv://m4upgraded124_db_user:AfBUzFVEZ45KKh3g@healthcarecluster.k0nyyfn.mongodb.net/healthcare_db?appName=HealthcareCluster` |
   | `DATABASE_NAME` | `healthcare_db` |
   | `GEMINI_API_KEY` | *(Your Gemini API Key)* |

5. Click **Create Web Service**.

---

## 🌐 Method 3: Separate Backend & Frontend Services

If you prefer two separate services (Backend Web Service + Static Frontend Site):

### 1. Backend (Web Service)
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `MONGODB_URI`
  - `DATABASE_NAME`
  - `GEMINI_API_KEY`
- Once deployed, copy your backend URL (e.g. `https://healthcare-api.onrender.com`).

### 2. Frontend (Static Site)
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://healthcare-api.onrender.com` (Your Render Backend URL)
- **Redirects / Rewrites**:
  - Add Rule: `/*` → `/index.html` (Rewrite)
