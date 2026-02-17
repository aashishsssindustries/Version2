# Deploying WealthMax to Render

This guide provides step-by-step instructions to deploy the WealthMax application (Backend and Frontend) to Render.com.

## Prerequisites
1.  **GitHub Repository**: Ensure your project is pushed to a GitHub repository.
2.  **Render Account**: Create an account at [render.com](https://render.com/).
3.  **Supabase Credentials**: Have your Supabase connection details ready (from your local `.env` file).

---

## Part 1: Backend Deployment

1.  **Create a New Web Service**
    *   Go to the [Render Dashboard](https://dashboard.render.com/).
    *   Click **New +** and select **Web Service**.
    *   Connect your GitHub repository `WealthMax`.

2.  **Configure the Service**
    *   **Name**: `wealthmax-backend` (or similar)
    *   **Region**: Singapore (or nearest to you)
    *   **Branch**: `main` (or your working branch)
    *   **Root Directory**: `backend` (Important!)
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install && npm run build`
        *   *Note: This installs dependencies and runs the TypeScript compiler.*
    *   **Start Command**: `npm start`
    *   **Plan**: Free

3.  **Environment Variables**
    *   Scroll down to **Environment Variables** and click **Add Environment Variable**.
    *   Add the following (copy values from your local `backend/.env`):

    | Key | Value | Notes |
    | :--- | :--- | :--- |
    | `NODE_ENV` | `production` | Default in Render |
    | `DATABASE_URL` | *Your Supabase URI* | `postgresql://...` |
    | `JWT_SECRET` | *Your Secret* | Any robust string |
    | `ENCRYPTION_KEY` | *Your Key* | **Must be exact 32 chars** |
    | `CORS_ORIGIN` | `*` | Temporarily allow all, or put your frontend URL if known |
    | `MFAPI_BASE_URL` | `https://api.mfapi.in` | Optional |
    | `NPM_CONFIG_PRODUCTION`| `false` | **Critical**: Ensures TypeScript is installed for the build |

    *   *Optional (if using email features)*: `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_USER`, `SMTP_PASS`.

4.  **Deploy**
    *   Click **Create Web Service**.
    *   Render will start building. Watch the logs.
    *   Once successful, you will see a URL like `https://wealthmax-backend.onrender.com`. **Copy this URL.**

---

## Part 2: Frontend Deployment

1.  **Create a New Static Site**
    *   Go to the Render Dashboard.
    *   Click **New +** and select **Static Site**.
    *   Connect the **same** GitHub repository.

2.  **Configure the Site**
    *   **Name**: `wealthmax-frontend`
    *   **Branch**: `main`
    *   **Root Directory**: `frontend`
    *   **Build Command**: `npm install && npm run build`
    *   **Publish Directory**: `dist`

3.  **Environment Variables**
    *   Add the following:

    | Key | Value | Notes |
    | :--- | :--- | :--- |
    | `VITE_API_BASE_URL` | `https://wealthmax-backend.onrender.com/api/v1` | **Append `/api/v1`** to your backend URL |

4.  **Deploy**
    *   Click **Create Static Site**.
    *   Once fully deployed, you will get a URL like `https://wealthmax-frontend.onrender.com`.

---

## Part 3: Final Configuration

1.  **Update Backend CORS**
    *   Go back to your **Backend Service** dashboard > **Environment**.
    *   Edit the `CORS_ORIGIN` variable.
    *   Set it to your new Frontend URL (e.g., `https://wealthmax-frontend.onrender.com`).
        *   *Note: remove any trailing slash.*
    *   **Save Changes**. Render will automatically restart the backend.

2.  **Verify**
    *   Open your Frontend URL.
    *   Try to Login. If successful, your backend and database are connected properly!

---

## Part 4: Fixing PDF Generation (Puppeteer)

If you encounter an error like `Tried to find the browser at the configured path...`, it is because Render does not include Chrome by default. You must add it manually.

1.  **Add the Chrome Buildpack**
    *   Go to your **Backend Service** dashboard > **Settings**.
    *   Scroll down to **Build & Deploy** > **Buildpacks**.
    *   Click **Add Buildpack**.
    *   Enter this URL: `https://github.com/render-inc/render-buildpack-chrome`
    *   Click **Save Changes**.

2.  **Update Environment Variables**
    *   Go to **Environment**.
    *   Add the following variables:

    | Key | Value | Notes |
    | :--- | :--- | :--- |
    | `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | `true` | Tells Puppeteer to use the system Chrome |
    | `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/google-chrome-stable` | The path where the buildpack installs Chrome |

3.  **Redeploy**
    *   Go to the top of the dashboard and click **Manual Deploy** > **Deploy latest commit**.
    *   This will trigger a new build that installs Chrome.

