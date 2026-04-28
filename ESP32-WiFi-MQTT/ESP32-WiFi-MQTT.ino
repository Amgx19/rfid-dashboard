#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <WiFiManager.h> // يجب تثبيت هذه المكتبة
#include <LiquidCrystal_I2C.h>
#include <PubSubClient.h> // يجب تثبيت هذه المكتبة

// ========== الإعدادات ==========
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

// مواضيع MQTT (يجب أن تتطابق مع السيرفر)
const char* topic_publish_card = "eng_amjad/proj/card_uid";
const char* topic_subscribe_cmd = "eng_amjad/proj/door_cmd";

// ========== Pins ==========
#define SS_PIN 5
#define RST_PIN 22
#define RELAY_PIN 4 // افترضنا أن الريلاي موصول هنا

// ========== كائنات الأجهزة ==========
MFRC522 mfrc522(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);
WiFiClient espClient;
PubSubClient client(espClient);
WiFiManager wifiManager;

// متغيرات للتحكم بالباب
unsigned long doorTimer = 0;
bool isDoorOpen = false;

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // الباب مقفل افتراضياً (حسب نوع الريلاي)

  // تشغيل الأجهزة
  SPI.begin();
  mfrc522.PCD_Init();
  Wire.begin(16, 17); // SDA, SCL
  lcd.init();
  lcd.backlight();
  
  // 1. شاشة الترحيب والاتصال بالواي فاي
  lcd.setCursor(0, 0);
  lcd.print("Setup WiFi...");
  
  // خاصية Plug & Play: إذا لم يجد شبكة، ينشئ Access Point
  // اسم الشبكة: Eng-Amjad-System
  bool res = wifiManager.autoConnect("Smart-Access-System", "password");

  if(!res) {
    lcd.print("Failed!");
    ESP.restart();
  }

  lcd.clear();
  lcd.print("WiFi Connected!");
  delay(1000);

  // 2. إعداد MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  
  lcd.clear();
  lcd.print("System Ready");
}

void loop() {
  // التأكد من استمرار اتصال MQTT
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // ميكانيكية القفل التلقائي (بعد 5 ثواني)
  if (isDoorOpen && millis() - doorTimer > 5000) {
    lockDoor();
  }

  // قراءة الكرت
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  String uid = getUID();
  Serial.println("Card: " + uid);
  
  lcd.clear();
  lcd.print("Checking Card...");
  lcd.setCursor(0, 1);
  lcd.print(uid);

  // إرسال الكرت للسيرفر
  client.publish(topic_publish_card, uid.c_str());

  mfrc522.PICC_HaltA();
  delay(1000); // منع القراءة المتكررة السريعة
}

// دالة استقبال الأوامر من السيرفر (والأزرار)
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("Command received: ");
  Serial.println(message);

  if (message == "OPEN") {
    unlockDoor();
  } else if (message == "CLOSE") {
    lockDoor();
  } else if (message == "DENIED") {
    lcd.clear();
    lcd.print("ACCESS DENIED");
    delay(2000);
    resetScreen();
  }
}

void unlockDoor() {
  digitalWrite(RELAY_PIN, HIGH); // فتح القفل
  isDoorOpen = true;
  doorTimer = millis();
  
  // تحديث الشاشة
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("DOOR IS OPEN"); // ✅ الرسالة المطلوبة
  lcd.setCursor(0, 1);
  lcd.print("Welcome!");
}

void lockDoor() {
  digitalWrite(RELAY_PIN, LOW); // قفل القفل
  isDoorOpen = false;
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("DOOR LOCKED");
  delay(1000);
  resetScreen();
}

void resetScreen() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Ready to Scan");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    // ID عشوائي
    String clientId = "ESP32-" + String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      // إعادة الاشتراك في قناة الأوامر
      client.subscribe(topic_subscribe_cmd);
      
      lcd.clear();
      lcd.print("Server Online");
      delay(500);
      resetScreen();
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(2000);
    }
  }
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
