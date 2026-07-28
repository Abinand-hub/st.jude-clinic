# Technical & Design Decisions

This document outlines the major decisions made during the development of the St. Jude Clinic Shift Management OS.

## 1. Architecture & Stack
**Decision:** Single-repository monolith using React (Vite) for the frontend and Express (Node.js) for the backend, communicating via REST API.
**Reason:** This keeps the project lightweight and simple to run with a single `npm run dev` command. It avoids the complexity of monorepos while still providing a robust separation of concerns between the client UI and the server logic. 

## 2. Data Persistence
**Decision:** In-memory Maps (`dataStore.ts`) pre-seeded by a CSV import engine on startup.
**Reason:** For a prototype and review environment, an in-memory database guarantees that the app always boots in a clean, predictable state. It removes the need for reviewers to configure external databases (like PostgreSQL) to test the app.

## 3. Conflict Resolution (Shift Editing)
**Decision:** When a manager edits a shift's time, the system allows the save but automatically revokes any staff claims that now conflict with their other scheduled shifts.
**Reason:** Blocking the save would force the manager into a tedious flow of manually unassigning people first. By automatically handling it and returning an `impactReport` (surfaced as an alert in the UI), the manager is instantly informed of who needs to be replaced without blocking their workflow.

## 4. UI/UX & Theming
**Decision:** Transitioned from a generic dark theme to a crisp, professional White and Blue medical aesthetic with a split-screen glassmorphism login.
**Reason:** Medical software often suffers from poor UX. Using a modern, premium design with Tailwind CSS increases trust and makes the application feel significantly more professional and intuitive for both staff and managers.

---

## What I'd Do Differently With More Time

If given more time to scale this application for real-world production use, I would implement **Persistent Database & ORM**. 
Currently, the application relies on an in-memory data store which wipes on server restart. I would replace this with a **PostgreSQL** database managed via **Prisma ORM** or Drizzle. This would allow for proper relational integrity (foreign keys between Users and Shifts), permanent data storage, and scalable concurrent connections, making it fully production-ready rather than just a prototype.
