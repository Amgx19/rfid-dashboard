const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dgram = require('dgram');  // UDP مدمج في Node.js

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  } 
});

const PORT = 3001;
const UDP_PORT = 4210;

// تخزين البيانات
let authorizedCards = [
  { uid: "89-27-34-03", name: "أمجد زكريا" }
];
let logs = [];
let lastCard = null;
let esp32Socket = null;

// ========== UDP Discovery Server ==========
const udpServer = dgram.createSocket('udp4');

udpServer.on('error', (err) => {
  console.error('❌ UDP Server error:', err);
  udpServer.close();
});

udpServer.on('message', (msg, rinfo) => {
  const message = msg.toString();
  console.log(`📨 UDP from ${rinfo.address}:${rinfo.port} - ${message}`);
  
  if (message === 'DISCOVER_ACCESS_SERVER') {
    const response = Buffer.from('ACCESS_SERVER_HERE');
    udpServer.send(response, rinfo.port, rinfo.address, (err) => {
      if (err) {
        console.error('UDP send error:', err);
      } else {
        console.log(`✅ Sent discovery response to ${rinfo.address}`);
      }
    });
  }
});

udpServer.on('listening', () => {
  const address = udpServer.address();
  console.log(`📡 UDP Discovery listening on ${address.address}:${address.port}`);
});

// Bind UDP server
udpServer.bind(UDP_PORT, () => {
  console.log('UDP Server ready');
});

// ========== Socket.IO Events ==========
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  socket.on("identify", (data) => {
    if (data.device === "esp32") {
      esp32Socket = socket;
      console.log("✅ ESP32 identified!");
      socket.emit("connected", { status: "ok" });
    }
  });

  socket.on("card-read", (data) => {
    console.log("Card read from ESP32:", data);
    handleCardRead(data.uid);
  });

  socket.on("request-init", () => {
    console.log("Frontend requesting init data");
    socket.emit("init", { authorizedCards, logs: logs.slice(0, 100), lastCard });
  });

  if (!esp32Socket || socket.id !== esp32Socket.id) {
    console.log("✅ Frontend connected");
    socket.emit("init", { authorizedCards, logs: logs.slice(0, 100), lastCard });
  }

  socket.on("add-card", (data) => {
    const uid = data.uid.trim().toUpperCase();
    const name = data.name.trim();
    if (!uid) return;
    
    if (!authorizedCards.find(c => c.uid === uid)) {
      authorizedCards.push({ uid, name });
      io.emit("update-cards", authorizedCards);
      console.log("Card added:", uid, name);
    }
  });

  socket.on("remove-card", (uid) => {
    uid = uid.trim().toUpperCase();
    authorizedCards = authorizedCards.filter((c) => c.uid !== uid);
    io.emit("update-cards", authorizedCards);
    console.log("Card removed:", uid);
  });

  socket.on("clear-logs", () => {
    logs = [];
    lastCard = null;
    console.log("Logs cleared");
    io.emit("init", { authorizedCards, logs: [], lastCard: null });
  });

  socket.on("unlock-door", () => {
    console.log("Unlock requested from UI");
    sendToESP32({ event: "UNLOCK" });
    io.emit("door-state", { state: "unlocked" });
    
    setTimeout(() => {
      sendToESP32({ event: "LOCK" });
      io.emit("door-state", { state: "locked" });
      io.emit("auto-locked");
    }, 60000);
  });

  socket.on("lock-door", () => {
    console.log("Lock requested from UI");
    sendToESP32({ event: "LOCK" });
    io.emit("door-state", { state: "locked" });
  });

  socket.on("get-logs", () => {
    socket.emit("init", { authorizedCards, logs: logs.slice(0, 200), lastCard });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    if (esp32Socket && socket.id === esp32Socket.id) {
      console.log("❌ ESP32 disconnected");
      esp32Socket = null;
    }
  });
});

function handleCardRead(uid) {
  const cardData = authorizedCards.find(c => c.uid === uid);
  const isAuthorized = !!cardData;
  const name = cardData ? cardData.name : "";

  lastCard = { uid, name };

  const entry = { 
    uid, 
    name, 
    authorized: isAuthorized, 
    time: new Date().toISOString() 
  };
  
  logs.unshift(entry);
  if (logs.length > 200) logs.pop();

  console.log("Card processed:", uid, name, "authorized:", isAuthorized);

  io.emit("card-attempt", entry);

  if (isAuthorized) {
    sendToESP32({ event: "AUTHORIZED" });
    sendToESP32({ event: "UNLOCK" });
    
    setTimeout(() => {
      sendToESP32({ event: "LOCK" });
      io.emit("door-state", { state: "locked" });
    }, 5000);
  } else {
    sendToESP32({ event: "UNAUTHORIZED" });
  }
}

function sendToESP32(data) {
  if (esp32Socket) {
    esp32Socket.emit("esp32-command", data);
    console.log("Sent to ESP32:", data);
  } else {
    console.log("⚠️ ESP32 not connected");
  }
}

app.get("/", (req, res) => {
  res.json({
    status: "running",
    esp32Connected: !!esp32Socket,
    cardsCount: authorizedCards.length,
    logsCount: logs.length,
    udpDiscovery: `Port ${UDP_PORT}`
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log("=".repeat(60));
  console.log("✅ Smart Access Control Server Started");
  console.log("=".repeat(60));
  console.log(`🌐 HTTP Server: http://0.0.0.0:${PORT}`);
  console.log(`🔌 Socket.IO: ws://0.0.0.0:${PORT}`);
  console.log(`📡 UDP Discovery: Port ${UDP_PORT}`);
  console.log("=".repeat(60));
  
  const os = require('os');
  const interfaces = os.networkInterfaces();
  console.log("\n📡 Available Network Interfaces:");
  Object.keys(interfaces).forEach(ifname => {
    interfaces[ifname].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  ${ifname}: ${iface.address}`);
      }
    });
  });
  console.log("\n💡 ESP32 will auto-discover this server!");
  console.log("=".repeat(60) + "\n");
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  udpServer.close();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});