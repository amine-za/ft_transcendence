# ft_transcendence 🎮

Welcome to **ft_transcendence**, a web-based real-time multiplayer Pong contest!  
This project is a single-page application (SPA) showcasing a modern Pong platform with multiplayer tournaments, robust security, and extensible modules.  
Built with passion, it leverages Docker for seamless deployment and focuses on user experience.  

---

## 📖 Project Overview

**ft_transcendence** is a feature-rich website where users can:

- Play real-time Pong with local or remote players.
- Join automated multiplayer tournaments with alias-based registration.
- Enjoy a secure, user-friendly SPA built with **Bootstrap** (frontend) and **Django** (backend).

---

## ✨ Features

- **Core Game**: Real-time multiplayer Pong, supporting local and remote players.
- **Tournament System**: Automated matchmaking with alias-based registration.
- **Single-Page Application**: Responsive SPA compatible with latest Google Chrome and one additional browser.

### 🔐 Security
- Hashed passwords
- Two-Factor Authentication (2FA)
- JWT (JSON Web Tokens)
- Protection against SQL injection and XSS

### 🕹️ Multiplayer Enhancements
- Supports >2 players (e.g., 4-player squared board)

### 🤖 AI Opponent
- Simulates keyboard input
- Refreshes 1/sec
- Uses power-ups
- Can win matches

### 🎨 Customization
- Power-ups, maps, with a default basic mode

### 🌐 Accessibility
- Multi-language support (3+ languages)
- Extended browser compatibility

### 🛢️ Database
- PostgreSQL for robust data management

### 📦 Deployment
- Dockerized
- Runs with `docker-compose up --build` in rootless mode on Linux

---

## 🛠️ Chosen Modules

### 🧩 Major Modules

- **Framework Backend (Django)**: Scalable server-side solution.
- **Remote Authentication (OAuth 2.0 with 42)**: Secure login via 42’s OAuth 2.0.
- **Two-Factor Authentication (2FA) & JWT**: Enhanced security via 2FA (SMS/app/email) and JWT.
- **Multiple Players**: >2 players in a single game (e.g., 4-player squared board).
- **AI Opponent**: Simulates human play, uses power-ups (no A* algorithm).

### 🧱 Minor Modules

- **Database (PostgreSQL)**: Reliable data storage.
- **Front-End Framework (Bootstrap)**: Responsive UI.
- **Browser Compatibility**: Supports an additional browser.
- **Game Customization**: Power-ups, attacks, maps with user-friendly settings.
- **Multiple Language Support**: 3+ languages with a language switcher.

---

🧑‍💻 Development Guidelines

- Backend: Django with PostgreSQL
    
- Frontend: Vanilla JS + Bootstrap for responsive SPA, supports browser Back/Forward

🔐 Security

- Hashed passwords

- SQL injection/XSS protection

- HTTPS (WSS for WebSockets)

- 2FA and JWT

- Sensitive data stored in .env

🧠 AI

- Simulates keyboard input

- Refreshes every 1 second

- No A* algorithm

---

## 🚀 Installation

### Clone the Repository
```bash
git clone https://github.com/your-username/ft_transcendence.git
cd ft_transcendence

Set Up Environment

Create a .env file in the root (ignored by Git):

DB_HOST=localhost
DB_USER=your_user
DB_PASS=your_password
SECRET_KEY=your_secret_key
OAUTH_CLIENT_ID=your_42_client_id
OAUTH_CLIENT_SECRET=your_42_client_secret

Run with Docker

    Ensure Docker and Docker Compose are installed.

    Build and run:

docker-compose up --build

    💡 On Linux clusters, use rootless Docker with runtime files in /goinfre or /sgoinfre.

Access the Website

    Visit: https://localhost

```
📂 Project Structure

ft_transcendence/
├── docker-compose.yml     # Docker Compose config
├── .env                   # Environment variables (ignored)
├── src/                   # Source code
│   ├── backend/           # Django backend
│   ├── frontend/          # Bootstrap frontend
│   ├── database/          # PostgreSQL configs
│   └── game/              # Pong game logic & AI
├── docs/                  # Documentation
└── README.md              # This file



Enjoy ft_transcendence! 🏓

