<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1924975e-bd27-4295-9fe8-9807dd44c6ef

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment & Live URL

This application is configured for deployment on Node.js hosting platforms like **Render.com**. 

**Note on Cold Starts:** Because this project uses a free hosting tier, the server will "go to sleep" after a period of inactivity. When you visit the URL for the first time, you may experience a **cold start delay of 15-30 seconds**. 
Additionally, because this application utilizes an in-memory database to simulate a lightweight environment, the database is **wiped and automatically re-seeded with clean data via the CSV importer** every time the server wakes up. This guarantees a clean environment for testing and review!

## Demo Credentials

The backend seeds several users by default. You can log in using these credentials:

**Manager Login**
- **Email:** `dr.sarah@stjude.clinic`
- **Password:** `manager123`

**Staff Login (Example)**
- **Email:** `dr.chen@stjude.clinic`
- **Password:** `staff123`
