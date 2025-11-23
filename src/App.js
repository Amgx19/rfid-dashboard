// src/App.js
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import Header from "./components/Header/Header";
import StatsCards from "./components/StatsCards/StatsCards";
import LastCardRead from "./components/LastCardRead/LastCardRead";
import DoorControl from "./components/DoorControl/DoorControl";
import AuthorizedCards from "./components/AuthorizedCards/AuthorizedCards";
import ActivityLogs from "./components/ActivityLogs/ActivityLogs";
import "./styles/global.css";
import "./styles/dark-mode.css";
import "./App.css";

const socket = io("http://172.20.10.6:3001");

function App() {
  const [cards, setCards] = useState([]);
  const [logs, setLogs] = useState([]);
  const [lastCard, setLastCard] = useState("-");
  const [lastCardName, setLastCardName] = useState("");
  const [status, setStatus] = useState("-");
  const [newCard, setNewCard] = useState("");
  const [newCardName, setNewCardName] = useState("");
  const [doorState, setDoorState] = useState("locked");
  const [showSuccess, setShowSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // 🆕

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    if (savedMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.body.classList.toggle('dark-mode');
  };

  useEffect(() => {
    // 🆕 مراقبة حالة الاتصال
    socket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });
    
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });
    
    socket.on("init", ({ authorizedCards, logs: initLogs, lastCard }) => {
      setCards(authorizedCards || []);
      setLogs(initLogs || []);
      if (lastCard) {
        setLastCard(lastCard.uid);
        setLastCardName(lastCard.name || "");
      }
    });

    socket.on("update-cards", (cards) => setCards(cards));

    socket.on("card-attempt", (entry) => {
      setLogs((prev) => [entry, ...prev].slice(0, 200));
      setLastCard(entry.uid);
      setLastCardName(entry.name || "");
      setStatus(entry.authorized ? "✅ مصرح" : "❌ مرفوض");
      
      if (entry.authorized) {
        setDoorState("unlocked");
      }
    });

    socket.on("door-state", ({ state }) => {
      setDoorState(state);
    });

    socket.on("auto-locked", () => {
      setDoorState("locked");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("init");
      socket.off("update-cards");
      socket.off("card-attempt");
      socket.off("door-state");
      socket.off("auto-locked");
    };
  }, []);

  const handleAdd = () => {
    const uid = newCard.trim().toUpperCase();
    const name = newCardName.trim();
    if (!uid) return;
    socket.emit("add-card", { uid, name });
    setNewCard("");
    setNewCardName("");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleRemove = (uid) => {
    socket.emit("remove-card", uid);
  };

  const handleUnlock = () => {
    socket.emit("unlock-door");
    setDoorState("unlocked");
  };

  const handleLock = () => {
    socket.emit("lock-door");
    setDoorState("locked");
  };

  const handleRefreshLogs = () => {
    socket.emit("get-logs");
  };

  // 🆕 مسح السجلات
  const handleClearLogs = () => {
    setLogs([]);
    // يمكنك إرسال event للسيرفر لمسح السجلات من الذاكرة أيضاً
    socket.emit("clear-logs");
  };

  return (
    <div className="app-container">
      <Header 
        doorState={doorState} 
        darkMode={darkMode} 
        onToggleDarkMode={toggleDarkMode}
        isConnected={isConnected} // 🆕
      />

      <StatsCards logs={logs} cards={cards} />

      <div className="main-grid">
        <LastCardRead 
          lastCard={lastCard}
          lastCardName={lastCardName}
          status={status}
        />

        <DoorControl 
          doorState={doorState}
          onUnlock={handleUnlock}
          onLock={handleLock}
        />

        <AuthorizedCards 
          cards={cards}
          newCard={newCard}
          newCardName={newCardName}
          showSuccess={showSuccess}
          onCardChange={setNewCard}
          onNameChange={setNewCardName}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />

        <ActivityLogs 
          logs={logs}
          onRefresh={handleRefreshLogs}
          onClearLogs={handleClearLogs} // 🆕
        />
      </div>
    </div>
  );
}

export default App;