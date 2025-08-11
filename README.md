
# BondTales Chat 📱💬
A real-time chat application that keeps conversations flowing — where every message leaves a little ‘tail’ of connection.

---

## 🚀 Features

### 👤 User Features
- Secure registration & login
- One-on-one and group chats
- Send text, images, voice, and files
- Message read receipts & typing indicators
- Searchable chat history
- Self-destructing media
- Mood-based themes
- Real-time message translation
- Shared live whiteboard
- Story-mode chat playback

### 🛠 Admin Features
- Manage users & groups
- Monitor reported messages
- Content moderation
- View analytics & usage stats
- Broadcast announcements

---

## 📂 Project Structure

```

BondTalesChat/
│
├── client/                  # Angular frontend (User)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Reusable UI parts
│   │   │   ├── pages/       # Page views
│   │   │   ├── services/    # API & socket services
│   │   │   ├── store/       # State management
│   │   │   └── assets/      # Images, styles
│   │   └── index.html
│
├── admin/                   # Angular admin panel
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   └── assets/
│   │   └── index.html
│
├── server/                  # C# .NET backend API
│   ├── Controllers/         # API endpoints
│   ├── Models/              # Entity models
│   ├── Services/            # Business logic
│   ├── Repositories/        # DB access
│   ├── DTOs/                # Data transfer objects
│   ├── Migrations/          # SQL migrations
│   └── Program.cs           # App entry point
│
├── database/                # SQL scripts
│   ├── schema.sql
│   └── seed-data.sql
│
├── firebase/                # Firebase configs
│   ├── firebase-config.json
│
├── docs/                    # Documentation & diagrams
│
├── .env.example             # Environment variables template
├── README.md
└── LICENSE

````

---

## 🛠 Tech Stack

**Frontend:** Angular, TailwindCSS, RxJS, WebSocket  
**Backend:** C# .NET Core, REST API, SignalR  
**Database:** SQL Server  
**Realtime Features:** Firebase Realtime Database / Firestore (for presence & notifications)  
**Auth:** JWT Authentication + Firebase Auth  
**Deployment:** Docker, Azure / AWS

---

## 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/BondTalesChat.git
cd BondTalesChat
````

2. **Setup environment variables**
   Copy `.env.example` to `.env` and update values.

3. **Run backend**

```bash
cd server
dotnet restore
dotnet run
```

4. **Run frontend (User app)**

```bash
cd client
npm install
ng serve
```

5. **Run admin panel**

```bash
cd admin
npm install
ng serve
```

---

## 🔐 Access

* **User App:** `/client`
* **Admin Panel:** `/admin`
* **Backend API:** `/server`

---

## 🗂 Admin Panel Setup

* The Admin Panel is developed as a separate Angular project (`admin`) for better modularity and maintainability.
* Both the main application and the admin panel are hosted separately.
* After successful login, the backend verifies the user role:

  * **Admin role:** Redirects to the Admin Panel URL.
  * **User role:** Redirects to the Main Application URL.
* Redirection is handled via Angular routing or browser navigation.
* JWT tokens are passed between apps for authentication, validated on the backend before granting access.

Example URLs:

* **Admin Panel:** `https://example.com/admin`
* **Main App:** `https://example.com`

---

## 🚢 Deployment

* Use Docker for containerized builds
* Host backend on Azure App Service or AWS EC2
* Deploy Angular apps via Netlify/Vercel/Azure Static Web Apps
* Use SQL Server on Azure SQL Database or AWS RDS

---
## 🗂 Repository Structure Strategy

For better scalability and team collaboration, **BondTalesChat** is split into multiple repositories:

| Repository Name                  | Description                               |
|-----------------------------------|-------------------------------------------|
| **BondTalesChat-Client**          | Angular user-facing chat application      |
| **BondTalesChat-Admin**           | Angular-based admin panel for management  |
| **BondTalesChat-Server**          | C# .NET backend API with SignalR support  |
| **BondTalesChat-Database**        | SQL scripts, migrations, and seed data    |
| **BondTalesChat-Firebase**        | Firebase configuration for presence & push notifications |
| **BondTalesChat-Docs**            | Documentation, diagrams, and flowcharts   |

### 🔄 How These Repos Work Together
1. **User Login (Client)** → Calls **Server API** → Authenticates & issues JWT → Redirects based on role.
2. **Admin Login (Admin)** → Calls **Server API** → Authenticates & loads admin dashboard.
3. **Server** handles business logic, data access, and real-time events via SignalR.
4. **Database** repo holds all SQL schema and migration scripts, used by the Server repo.
5. **Firebase** repo holds configs for notifications and online/offline tracking.
6. **Docs** repo stores architecture diagrams, API references, and setup guides.

> This separation ensures independent deployment, isolated testing, and easier CI/CD pipelines.


## 📜 License

MIT License — Free to use & modify.
