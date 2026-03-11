# 📡 OpenCommStack - Open Communication Stack (Local Docker)

**OpenCommStack** adalah platform komunikasi instan open-source yang berjalan 100% lokal menggunakan Docker Compose. Tidak memerlukan internet atau layanan cloud eksternal.

## ✨ Fitur

- 💬 **Obrolan Real-time** — Pesan 1:1 dan grup via Socket.io/WebSocket
- 📎 **Kirim Media** — Foto, video, file, dan dokumen
- 😊 **Reaksi & Edit** — Reaksi emoji, edit, hapus pesan
- ✅ **Tanda Baca** — Centang biru (✓✓) untuk pesan terbaca
- ⌨️ **Indikator Mengetik** — Animasi saat pengguna mengetik
- 📸 **Status/Stories** — Pembaruan 24 jam dengan latar warna
- 📞 **Panggilan WebRTC** — Suara & video via LAN
- 🌙 **Mode Gelap** — Toggle dark/light mode
- 🔐 **Enkripsi E2E** — Simulasi dengan CryptoJS
- 🇮🇩 **Bahasa Indonesia** — Seluruh UI dalam Bahasa Indonesia
- 📱 **PWA** — Installable sebagai aplikasi

## 🛠️ Tech Stack

| Layer    | Technology                                               |
| -------- | -------------------------------------------------------- |
| Frontend | Next.js 15, React 19, Tailwind CSS, Zustand, React Query |
| Backend  | Node.js, Express, Socket.io, Prisma ORM                  |
| Database | PostgreSQL 16                                            |
| Calls    | WebRTC (peer-to-peer via LAN)                            |
| Deploy   | Docker Compose                                           |

## 🚀 Quick Start

### Prasyarat

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose

### Menjalankan

```bash
# Clone repo
git clone <repo-url> opencommstack
cd opencommstack

# Build dan jalankan
docker compose up --build

# Atau jalankan di background
docker compose up --build -d
```

Aplikasi akan tersedia di:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **Database**: localhost:5432

### Menghentikan

```bash
docker compose down

# Untuk menghapus semua data
docker compose down -v
```

## 📱 Cara Penggunaan

1. Buka [http://localhost:3000](http://localhost:3000) di browser
2. **Daftar** dengan nomor telepon dan PIN 6 digit
3. Buka tab kedua (atau browser lain) untuk membuat user kedua
4. Mulai mengobrol! 💬

### Testing Multi-User

Buka 2 tab browser berbeda, daftar sebagai 2 user berbeda, lalu mulai chat dan panggilan.

## 📁 Struktur Proyek

```
opencommstack/
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
│       ├── routes/           # REST API
│       └── socket/           # Real-time handlers
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── public/               # PWA manifest
    └── src/
        ├── app/              # Next.js pages
        ├── components/       # React components
        ├── hooks/            # Socket.io, WebRTC hooks
        ├── lib/              # API, i18n, utils
        └── store/            # Zustand stores
```

## 🔧 Environment Variables

### Backend

| Variable     | Default                                                          | Description           |
| ------------ | ---------------------------------------------------------------- | --------------------- |
| DATABASE_URL | postgresql://opencommstack:localdev123@db:5432/opencommstack     | PostgreSQL connection |
| JWT_SECRET   | opencommstack-local-secret-key-2024                              | JWT signing key       |
| PORT         | 3001                                                             | Server port           |
| CORS_ORIGIN  | http://localhost:3000                                            | Frontend URL          |

### Frontend

| Variable            | Default               | Description     |
| ------------------- | --------------------- | --------------- |
| NEXT_PUBLIC_API_URL | http://localhost:3001 | Backend API URL |
| NEXT_PUBLIC_WS_URL  | http://localhost:3001 | WebSocket URL   |

## 📝 License

MIT
