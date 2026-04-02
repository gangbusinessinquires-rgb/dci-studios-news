# DCI Studios News | Internal Staff Portal

A private, high-performance CMS for managing news cycles, editorial workflows, and staff access. This system uses a **Node.js** backend with a **MongoDB** database to handle article persistence and session-based authentication.

---

## 🛠️ Tech Stack
* **Engine:** Node.js / Express
* **Database:** MongoDB via Mongoose
* **Logic:** MVC-style pattern with EJS templating
* **Styling:** Custom CSS with CSS Variables and Glassmorphism
* **Security:** Session-based authentication with `connect-mongo`

---

## 🔐 Access Control & Roles
The system enforces strict route protection through `requireAuth` and `requireAdmin` middleware.

| Role | Permissions |
| :--- | :--- |
| **Editor** | Create articles, edit existing content, and view personal analytics. |
| **Admin** | Full Editor suite + access to the Admin Panel, publishing/unpublishing articles, and managing staff accounts. |

---

## 📂 Core Components

### 1. Editorial Dashboard (`/editor`)
The central hub for staff. It displays real-time statistics including total article counts and a list of recent posts with their current status (Draft/Published).

### 2. Article Management
* **Composer:** Supports Markdown for rich text formatting.
* **Categories:** Articles are tagged as `Breaking`, `Update`, or `Tech & Business Acquisition`.
* **Workflow:** Articles can be saved as a **Draft** for later review or **Published** immediately for public viewing.

### 3. Admin Suite (`/admin`)
* **Review Queue:** Admins can toggle article visibility between `published` and `draft` status.
* **Staff Management:** A dedicated interface to create new user accounts or revoke access from existing staff.

---

## 🚀 Deployment & Configuration
1.  **Environment:** Ensure `SERVER_PORT` is defined or defaults to `9016`.
2.  **Database:** Connect via the MongoDB URI string located in `server.js`.
3.  **Session:** The `dci-ultra-secret` key manages encrypted session cookies.

> **Warning:** Password storage currently utilizes plain text comparison. It is highly recommended to implement `bcrypt` for hashing before moving this to a production environment.
