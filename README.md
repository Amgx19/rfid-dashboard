<div align="center">

# 🔐 RFID Smart Access Control System

**A real-time, full-stack IoT access control system built with ESP32, Node.js, and React.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![ESP32](https://img.shields.io/badge/ESP32-Firmware-E7352C?style=flat-square&logo=espressif)](https://www.espressif.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socket.io)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)

</div>

---

## 📖 Overview

This project is a **Smart Access Control System** that uses RFID technology with an ESP32 microcontroller to identify users and grant or deny access in real time. Card scan data is transmitted to a Node.js server via **WebSocket**, processed instantly, and displayed on an interactive **React Dashboard** — no manual IP configuration required.

> 🎓 Originally conceived as a personal project during an IoT course at the **University of Baha**, this system was driven purely by passion — particularly an interest in how enterprise-grade systems like **GRMS (Guest Room Management Systems)** handle smart access control at scale. It was completed and polished post-graduation.

---

## 🏗️ System Architecture

```
┌─────────────────────┐       WebSocket        ┌──────────────────────┐
│   ESP32 + MFRC522   │ ─────────────────────► │   Node.js Backend    │
│   RFID Reader       │                         │   + Socket.IO        │
│   LCD I2C Display   │ ◄───────────────────── │   Data Validation    │
└─────────────────────┘    Auth Response         └──────────┬───────────┘
                                                            │ Socket.IO
                                                            ▼
                                                 ┌──────────────────────┐
                                                 │   React Dashboard    │
                                                 │   Real-time UI       │
                                                 └──────────────────────┘
```

**Auto-Discovery via UDP Broadcast** — The ESP32 discovers the server IP automatically on the local network. No hardcoded IP addresses needed.

---

## ✨ Features

### 🖥️ Dashboard (Frontend)
| Feature | Description |
|---|---|
| 🌙 **Dark Mode** | Full dark/light mode toggle |
| ⚡ **Real-time Updates** | Every RFID scan appears instantly via Socket.IO |
| ✅ **Access Status** | Clear visual distinction between `Authorized` and `Unauthorized` |
| 📊 **Entry Statistics** | Per-card access count and history |
| ➕ **Card Management** | Add trusted cards with a cardholder name |
| 🗑️ **Card Removal** | Remove access privileges instantly |
| 🛡️ **Input Validation** | Validates UID format and cardholder name before saving |

### ⚙️ Hardware & Firmware
- **ESP32** reads RFID UIDs via **MFRC522** module
- **LCD I2C** displays `Authorized ✓` or `Unauthorized ✗` directly on the device
- **UDP Broadcast** for automatic server discovery — plug and play
- **WebSocket** communication for low-latency, bidirectional data flow

### 🗄️ Backend
- **Node.js** server with **Socket.IO** for real-time event handling
- Card authorization logic and data persistence
- Broadcasts access events to all connected dashboard clients

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Microcontroller | ESP32 |
| RFID Module | MFRC522 |
| Display | LCD I2C (16x2) |
| Firmware Language | C++ (Arduino Framework) |
| Backend | Node.js + Socket.IO |
| Frontend | React + Tailwind CSS |
| Communication | WebSocket + UDP Broadcast |

---

## 📁 Project Structure

```
rfid-dashboard/
├── ESP32-WiFi-MQTT/       # Arduino/C++ firmware for ESP32
│   └── main.ino           # WiFi, RFID, LCD, WebSocket logic
├── backend/               # Node.js server
│   └── server.js          # Socket.IO, UDP broadcast, card management
├── src/                   # React frontend source
│   ├── components/        # Dashboard UI components
│   └── App.js             # Main app entry
├── public/                # Static assets
├── package.json
└── tailwind.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Arduino IDE (with ESP32 board support)
- ESP32 dev board + MFRC522 + LCD I2C (16x2)

---

### 1. Clone the Repository
```bash
git clone https://github.com/Amgx19/rfid-dashboard.git
cd rfid-dashboard
```

### 2. Start the Backend
```bash
cd backend
npm install
node server.js
```
> The backend listens on port `3001` and broadcasts its IP via UDP so the ESP32 can find it automatically.

### 3. Start the Frontend
```bash
# From the root directory
npm install
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Flash the ESP32
1. Open `ESP32-WiFi-MQTT/main.ino` in Arduino IDE
2. Set your **WiFi SSID and password** in the config section
3. Upload to your ESP32 board
4. The device will auto-discover the server IP on the local network

---

## 🔌 Hardware Wiring

### MFRC522 → ESP32
| MFRC522 Pin | ESP32 Pin |
|---|---|
| SDA (SS) | GPIO 5 |
| SCK | GPIO 18 |
| MOSI | GPIO 23 |
| MISO | GPIO 19 |
| RST | GPIO 27 |
| 3.3V | 3.3V |
| GND | GND |

### LCD I2C → ESP32
| LCD Pin | ESP32 Pin |
|---|---|
| SDA | GPIO 21 |
| SCL | GPIO 22 |
| VCC | 5V |
| GND | GND |

---

## 📸 Dashboard Preview

> The dashboard supports dark mode, real-time card scan logs, access statistics, and full card management — all updating live without page refresh.

---

## 🗺️ Roadmap

- [ ] Database persistence (MongoDB / SQLite)
- [ ] Multi-door / multi-reader support
- [ ] Role-based access levels (Admin, Guest, Staff)
- [ ] Mobile-responsive dashboard improvements
- [ ] MQTT protocol support as an alternative to WebSocket
- [ ] Notification system (email / SMS on unauthorized access)

---

## 🤖 AI-Assisted Development

This project was built with the help of AI tools to accelerate productivity — not to replace thinking. AI was used for generating boilerplate, reviewing code logic, and suggesting architectural improvements. All system design decisions, hardware integration, and feature choices were made independently.

---

## 👤 Author

**Amgx19**
- 🎓 Computer Engineering Graduate — University of Baha
- 💡 Passionate about IoT, Embedded Systems & Smart Infrastructure

---

<div align="center">
  <sub>Built with ❤️ and curiosity — from a course project to a complete system.</sub>
</div>
