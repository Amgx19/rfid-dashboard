#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>
#include <WebSocketsClient_Generic.h>
#include <WiFiUdp.h>

// ========== Server Settings ==========
const int serverPort = 3001;

// ========== RFID Pins ==========
#define SS_PIN 5
#define RST_PIN 22
MFRC522 mfrc522(SS_PIN, RST_PIN);

// ========== LCD ==========
#define LCD_SDA 16
#define LCD_SCL 17
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ========== WebSocket ==========
WebSocketsClient webSocket;
bool socketReady = false;
String serverIP = "";

// ========== WiFiManager ==========
WiFiManager wifiManager;

void setup() {
  Serial.begin(115200);
  
  Wire.begin(LCD_SDA, LCD_SCL);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  
  SPI.begin();
  mfrc522.PCD_Init();
  
  lcd.setCursor(0, 0);
  lcd.print("WiFi Setup...");
  
  wifiManager.setConfigPortalTimeout(180);
  
  if (!wifiManager.autoConnect("ESP32-Access")) {
    Serial.println("Failed to connect");
    lcd.clear();
    lcd.print("WiFi Failed!");
    delay(3000);
    ESP.restart();
  }
  
  Serial.println("\n✅ WiFi Connected!");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("Gateway: ");
  Serial.println(WiFi.gatewayIP());
  Serial.print("Subnet: ");
  Serial.println(WiFi.subnetMask());
  
  // حساب broadcast address الصحيح
  IPAddress broadcastIP = calculateBroadcast(WiFi.localIP(), WiFi.subnetMask());
  Serial.print("Broadcast IP: ");
  Serial.println(broadcastIP);
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected!");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP());
  delay(2000);
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Finding Server");
  
  // البحث بالطرق الثلاث
  if (findServerByBroadcast(broadcastIP)) {
    Serial.println("✅ Found via Broadcast");
  }
  else if (scanSubnetRange()) {
    Serial.println("✅ Found via Subnet Scan");
  }
  else if (tryGateway()) {
    Serial.println("✅ Found at Gateway");
  }
  else {
    Serial.println("❌ Server not found!");
    lcd.clear();
    lcd.print("Server Not Found");
    lcd.setCursor(0, 1);
    lcd.print("Check Server!");
    delay(5000);
    ESP.restart();
  }
  
  Serial.print("✅ Server IP: ");
  Serial.println(serverIP);
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting...");
  lcd.setCursor(0, 1);
  lcd.print(serverIP);
  
  webSocket.begin(serverIP.c_str(), serverPort, "/socket.io/?EIO=4&transport=websocket");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  delay(2000);
}

// حساب broadcast address الصحيح
IPAddress calculateBroadcast(IPAddress ip, IPAddress subnet) {
  IPAddress broadcast;
  for (int i = 0; i < 4; i++) {
    broadcast[i] = ip[i] | (~subnet[i]);
  }
  return broadcast;
}

// حساب نطاق الشبكة (first & last usable IP)
void getSubnetRange(IPAddress ip, IPAddress subnet, IPAddress &first, IPAddress &last) {
  IPAddress network;
  for (int i = 0; i < 4; i++) {
    network[i] = ip[i] & subnet[i];
  }
  
  first = network;
  first[3] += 1; // First usable IP
  
  last = calculateBroadcast(ip, subnet);
  last[3] -= 1; // Last usable IP
}

// Method 1: UDP Broadcast مع broadcast address الصحيح
bool findServerByBroadcast(IPAddress broadcastIP) {
  Serial.println("🔍 Method 1: UDP Broadcast...");
  Serial.print("Broadcasting to: ");
  Serial.println(broadcastIP);
  
  WiFiUDP udp;
  udp.begin(4210);
  
  const char* discoveryMsg = "DISCOVER_ACCESS_SERVER";
  
  // إرسال 10 مرات للتأكد
  for (int i = 0; i < 10; i++) {
    udp.beginPacket(broadcastIP, 4210);
    udp.write((const uint8_t*)discoveryMsg, strlen(discoveryMsg));
    udp.endPacket();
    
    Serial.print(".");
    delay(200);
  }
  Serial.println();
  
  unsigned long startTime = millis();
  while (millis() - startTime < 8000) {
    int packetSize = udp.parsePacket();
    if (packetSize) {
      char incomingPacket[255];
      int len = udp.read(incomingPacket, 255);
      if (len > 0) {
        incomingPacket[len] = 0;
      }
      
      Serial.print("Received: ");
      Serial.println(incomingPacket);
      
      if (strncmp(incomingPacket, "ACCESS_SERVER_HERE", 18) == 0) {
        serverIP = udp.remoteIP().toString();
        Serial.print("✅ Server responded from: ");
        Serial.println(serverIP);
        udp.stop();
        return true;
      }
    }
    delay(50);
  }
  
  Serial.println("No UDP response");
  udp.stop();
  return false;
}

// Method 2: Scan نطاق الشبكة الفعلي
bool scanSubnetRange() {
  Serial.println("🔍 Method 2: Scanning subnet range...");
  lcd.setCursor(0, 1);
  lcd.print("Subnet Scan...  ");
  
  IPAddress first, last;
  getSubnetRange(WiFi.localIP(), WiFi.subnetMask(), first, last);
  
  Serial.print("Scanning from ");
  Serial.print(first);
  Serial.print(" to ");
  Serial.println(last);
  
  // سكان النطاق الفعلي فقط
  for (uint8_t i = first[3]; i <= last[3]; i++) {
    IPAddress testIP = first;
    testIP[3] = i;
    
    // تخطي IP الخاص بنا
    if (testIP == WiFi.localIP()) continue;
    
    String testIPStr = testIP.toString();
    Serial.print("Testing: ");
    Serial.print(testIPStr);
    
    if (testServer(testIPStr)) {
      serverIP = testIPStr;
      Serial.println(" ✅ FOUND!");
      return true;
    }
    Serial.println(" ❌");
    
    lcd.setCursor(0, 1);
    lcd.print("Try: ");
    lcd.print(i);
    lcd.print("        ");
  }
  
  return false;
}

// Method 3: جرب Gateway مباشرة
bool tryGateway() {
  Serial.println("🔍 Method 3: Trying gateway...");
  
  String gatewayIP = WiFi.gatewayIP().toString();
  Serial.print("Gateway: ");
  Serial.println(gatewayIP);
  
  if (testServer(gatewayIP)) {
    serverIP = gatewayIP;
    return true;
  }
  
  return false;
}

bool testServer(String ip) {
  WiFiClient client;
  
  if (client.connect(ip.c_str(), serverPort, 1000)) { // 1 second timeout
    client.print("GET / HTTP/1.1\r\n");
    client.print("Host: " + ip + "\r\n");
    client.print("Connection: close\r\n\r\n");
    
    unsigned long timeout = millis();
    while (client.available() == 0) {
      if (millis() - timeout > 1000) {
        client.stop();
        return false;
      }
      delay(10);
    }
    
    String response = "";
    int bytesRead = 0;
    while (client.available() && bytesRead < 300) {
      char c = client.read();
      response += c;
      bytesRead++;
    }
    
    client.stop();
    
    // Check if response contains server indicators
    if (response.indexOf("status") > 0 || 
        response.indexOf("running") > 0 ||
        response.indexOf("esp32Connected") > 0) {
      return true;
    }
  }
  
  return false;
}

void loop() {
  webSocket.loop();

  if (!socketReady) return;
  
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  String uid = getUID();
  Serial.println("Card: " + uid);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Card UID:");
  lcd.setCursor(0, 1);
  if (uid.length() > 16) {
    lcd.print(uid.substring(0, 16));
  } else {
    lcd.print(uid);
  }

  sendCardToServer(uid);

  delay(1500);
  mfrc522.PICC_HaltA();
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("❌ Disconnected");
      socketReady = false;
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Server");
      lcd.setCursor(0, 1);
      lcd.print("Disconnected!");
      break;
      
    case WStype_CONNECTED: {
      Serial.println("✅ Connected to WebSocket");
      
      webSocket.sendTXT("40");
      delay(100);
      
      String identify = "42[\"identify\",{\"device\":\"esp32\"}]";
      webSocket.sendTXT(identify);
      Serial.println("Sent identify");
      
      socketReady = true;
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("System Ready!");
      lcd.setCursor(0, 1);
      lcd.print("Scan Card...");
      delay(1000);
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Waiting for");
      lcd.setCursor(0, 1);
      lcd.print("Card...");
      break;
    }
      
    case WStype_TEXT: {
      String msg = String((char*)payload);
      Serial.print("📩 ");
      Serial.println(msg);
      
      if (msg.startsWith("42")) {
        int jsonStart = msg.indexOf('{');
        if (jsonStart > 0) {
          String jsonStr = msg.substring(jsonStart, msg.lastIndexOf('}') + 1);
          handleServerMessage(jsonStr);
        }
      } else if (msg.startsWith("2")) {
        webSocket.sendTXT("3");
      }
      break;
    }
  }
}

void handleServerMessage(String message) {
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) return;

  if (doc.containsKey("event")) {
    String event = doc["event"];
    
    if (event == "AUTHORIZED") showAuthorized();
    else if (event == "UNAUTHORIZED") showUnauthorized();
  }
}

void sendCardToServer(String uid) {
  if (!socketReady) return;
  
  String message = "42[\"card-read\",{\"uid\":\"" + uid + "\"}]";
  webSocket.sendTXT(message);
  Serial.println("📤 Sent: " + message);
}

String getUID() {
  String uidStr = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uidStr += "0";
    uidStr += String(mfrc522.uid.uidByte[i], HEX);
    if (i != mfrc522.uid.size - 1) uidStr += "-";
  }
  uidStr.toUpperCase();
  return uidStr;
}

void showAuthorized() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("  ACCESS GRANTED");
  lcd.setCursor(0, 1);
  lcd.print("    ALLOWED!    ");
  delay(3000);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Waiting for");
  lcd.setCursor(0, 1);
  lcd.print("Card...");
}

void showUnauthorized() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(" ACCESS  DENIED ");
  lcd.setCursor(0, 1);
  lcd.print("  NOT ALLOWED!  ");
  delay(3000);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Waiting for");
  lcd.setCursor(0, 1);
  lcd.print("Card...");
}