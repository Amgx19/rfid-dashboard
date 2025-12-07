const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

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

// تخزين البيانات
let authorizedCards = [
  { uid: "89-27-34-03", name: "أمجد زكريا" }
];
let logs = [];
let lastCard = null;

// متغير لتخزين اتصال ESP32
let esp32Socket = null;

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  // التعرف على ESP32
  socket.on("identify", (data) => {
    if (data.device === "esp32") {
      esp32Socket = socket;
      console.log("✅ ESP32 identified!");
      socket.emit("connected", { status: "ok" });
    }
  });

  // استقبال قراءة البطاقة من ESP32
  socket.on("card-read", (data) => {
    console.log("Card read from ESP32:", data);
    handleCardRead(data.uid);
  });

  // التعرف على Frontend وإرسال البيانات الأولية
  socket.on("request-init", () => {
    console.log("Frontend requesting init data");
    socket.emit("init", { authorizedCards, logs: logs.slice(0, 100), lastCard });
  });

  // إرسال البيانات الأولية للواجهة تلقائياً
  if (!esp32Socket || socket.id !== esp32Socket.id) {
    console.log("✅ Frontend connected");
    socket.emit("init", { authorizedCards, logs: logs.slice(0, 100), lastCard });
  }

  // إضافة بطاقة من الواجهة
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

  // حذف بطاقة من الواجهة
  socket.on("remove-card", (uid) => {
    uid = uid.trim().toUpperCase();
    authorizedCards = authorizedCards.filter((c) => c.uid !== uid);
    io.emit("update-cards", authorizedCards);
    console.log("Card removed:", uid);
  });

  // في server.js، أضف هذا الـ event handler:

socket.on("clear-logs", () => {
  logs = [];
  lastCard = null;
  console.log("Logs cleared");
  io.emit("init", { authorizedCards, logs: [], lastCard: null });
});

  // فتح القفل من الواجهة
  socket.on("unlock-door", () => {
    console.log("Unlock requested from UI");
    sendToESP32({ event: "UNLOCK" });
    io.emit("door-state", { state: "unlocked" });
    
    // قفل تلقائي بعد 60 ثانية
    setTimeout(() => {
      sendToESP32({ event: "LOCK" });
      io.emit("door-state", { state: "locked" });
      io.emit("auto-locked");
    }, 60000);
  });

  // قفل فوري من الواجهة
  socket.on("lock-door", () => {
    console.log("Lock requested from UI");
    sendToESP32({ event: "LOCK" });
    io.emit("door-state", { state: "locked" });
  });

  // طلب السجلات
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

// ========== معالجة قراءة البطاقة ==========
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

  // إرسال للواجهة
  io.emit("card-attempt", entry);

  if (isAuthorized) {
    // إرسال لـ ESP32
    sendToESP32({ event: "AUTHORIZED" });
    sendToESP32({ event: "UNLOCK" });
    
    // قفل تلقائي بعد 5 ثواني
    setTimeout(() => {
      sendToESP32({ event: "LOCK" });
      io.emit("door-state", { state: "locked" });
    }, 5000);
  } else {
    sendToESP32({ event: "UNAUTHORIZED" });
  }
}

// ========== إرسال رسالة لـ ESP32 ==========
function sendToESP32(data) {
  if (esp32Socket) {
    esp32Socket.emit("esp32-command", data);
    console.log("Sent to ESP32:", data);
  } else {
    console.log("⚠️ ESP32 not connected");
  }
}

// ========== endpoint للتحقق من حالة السيرفر ==========
app.get("/", (req, res) => {
  res.json({
    status: "running",
    esp32Connected: !!esp32Socket,
    cardsCount: authorizedCards.length,
    logsCount: logs.length
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Socket.IO: http://172.20.10.6:${PORT}`);
  
  const os = require('os');
  const interfaces = os.networkInterfaces();
  console.log("\n📡 Available network interfaces:");
  Object.keys(interfaces).forEach(ifname => {
    interfaces[ifname].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  ${ifname}: ${iface.address}`);
      }
    });
  });
});