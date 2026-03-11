# 📡 OpenCommStack

**OpenCommStack** is an open-source, self-hosted communication platform that runs 100% locally using Docker Compose. No internet or external cloud services required.

## ✨ Features

- 💬 **Real-time Chat** — 1:1 and group messaging via Socket.io/WebSocket
- 📎 **Media Sharing** — Photos, videos, files, and documents
- 😊 **Reactions & Editing** — Emoji reactions, edit, and delete messages
- ✅ **Read Receipts** — Blue checkmarks (✓✓) for read messages
- ⌨️ **Typing Indicators** — Live animation when a user is typing
- 📸 **Stories/Status** — 24-hour updates with colored backgrounds
- 📞 **WebRTC Calls** — Voice & video calls over LAN
- 🌙 **Dark Mode** — Toggle between dark and light themes
- 🔐 **E2E Encryption** — Simulated end-to-end encryption with CryptoJS
- 📱 **PWA** — Installable as a progressive web app
- 📱 **Mobile App** — React Native (Expo) mobile client

## 🛠️ Tech Stack

| Layer    | Technology                                               |
| -------- | -------------------------------------------------------- |
| Frontend | Next.js 15, React 19, Tailwind CSS, Zustand, React Query |
| Backend  | Node.js, Express, Socket.io, Prisma ORM                  |
| Database | PostgreSQL 16                                            |
| Mobile   | React Native, Expo Router                                |
| Calls    | WebRTC (peer-to-peer over LAN)                           |
| Deploy   | Docker Compose                                           |

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose

### Running with Docker (Recommended)

```bash
# Clone the repo
git clone https://github.com/barokatu/OpenCommStack.git
cd OpenCommStack

# Build and start all services
docker compose up --build

# Or run in the background
docker compose up --build -d
```

Once running, the app is available at:

| Service      | URL                                                    |
| ------------ | ------------------------------------------------------ |
| Frontend     | [http://localhost:3000](http://localhost:3000)          |
| Backend API  | [http://localhost:3001](http://localhost:3001)          |
| Database     | `localhost:5432`                                       |

### Running without Docker (Local Development)

#### 1. Start PostgreSQL

Make sure you have PostgreSQL running locally, then create a database:

```bash
createdb opencommstack
```

#### 2. Start the Backend

```bash
cd backend
npm install

# Set your database URL
export DATABASE_URL="postgresql://your_user:your_password@localhost:5432/opencommstack"

# Run database migrations
npx prisma migrate deploy
npx prisma generate

# Start the dev server
npm run dev
```

The backend API will be available at `http://localhost:3001`.

#### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

#### 4. Start the Mobile App (Optional)

```bash
cd mobile
npm install
npx expo start
```

When prompted, enter your backend server URL (e.g., `http://192.168.1.x:3001`).

### Stopping

```bash
# Stop Docker services
docker compose down

# Stop and remove all data (database, uploads)
docker compose down -v
```

## 📱 Usage

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. **Register** with a phone number and a 6-digit PIN
3. Open a second tab (or another browser) to create a second user
4. Start chatting! 💬

### Multi-User Testing

Open 2 separate browser tabs, register as 2 different users, then start chatting and making calls.

## 📁 Project Structure

```
OpenCommStack/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── index.js          # Express + Socket.io server
│       ├── lib/              # Prisma client, crypto
│       ├── middleware/       # JWT auth
│       ├── routes/           # REST API endpoints
│       └── socket/           # Real-time event handlers
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── public/               # PWA manifest & icons
│   └── src/
│       ├── app/              # Next.js pages
│       ├── components/       # React components
│       ├── hooks/            # Socket.io, WebRTC hooks
│       ├── lib/              # API, i18n, utils
│       └── store/            # Zustand state stores
└── mobile/
    ├── app.json
    ├── package.json
    ├── app/                  # Expo Router screens
    ├── hooks/                # Socket.io hooks
    ├── lib/                  # API, constants, i18n
    └── store/                # Zustand state stores
```

## 🔧 Environment Variables

### Backend

| Variable       | Default                                                      | Description             |
| -------------- | ------------------------------------------------------------ | ----------------------- |
| `DATABASE_URL` | `postgresql://opencommstack:localdev123@db:5432/opencommstack` | PostgreSQL connection |
| `JWT_SECRET`   | `opencommstack-local-secret-key-2024`                        | JWT signing key         |
| `PORT`         | `3001`                                                       | Server port             |
| `CORS_ORIGIN`  | `http://localhost:3000`                                      | Allowed frontend origin |

### Frontend

| Variable              | Default                | Description     |
| --------------------- | ---------------------- | --------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API URL |
| `NEXT_PUBLIC_WS_URL`  | `http://localhost:3001` | WebSocket URL   |

## 🤝 Contributing

Contributions are welcome! Feel free to open issues and pull requests.

## 📝 License

MIT
