# St. Jude Clinic Shift Management OS

This contains everything you need to run your app locally.

## Stack Choice

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React (Icons).
- **Backend:** Express (Node.js), TypeScript.
- **Build Tool:** Vite.

## Local Setup

**Prerequisites:** Node.js v18+

To run the full stack locally with a single command, open your terminal and run:

```bash
npm install && npm run dev
```

## Testing

Tests are entirely optional for this project. However, static analysis and type-checking can be executed with a single command:

```bash
npm run lint
```

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
