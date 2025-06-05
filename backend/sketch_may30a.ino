#include <Wire.h>
#include <BH1750.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

// Pines sensores
#define DHTPIN 2
#define DHTTYPE DHT11
#define HUMEDAD_SUELO_PIN 4
#define SDA_PIN 21
#define SCL_PIN 20

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

// BLE UUIDs
#define SERVICE_UUID        "12345678-1234-1234-1234-123456789abc"
#define TEMP_UUID           "12345678-1234-1234-1234-123456789001"
#define HUM_UUID            "12345678-1234-1234-1234-123456789002"
#define LUX_UUID            "12345678-1234-1234-1234-123456789003"
#define SOIL_UUID           "12345678-1234-1234-1234-123456789004"

BLECharacteristic *tempChar;
BLECharacteristic *humChar;
BLECharacteristic *luxChar;
BLECharacteristic *soilChar;

// Callbacks para conexión y desconexión BLE
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override {
    Serial.println("Cliente conectado");
  }

  void onDisconnect(BLEServer* pServer) override {
    Serial.println("Cliente desconectado, reanudando advertising...");
    BLEDevice::getAdvertising()->start();  // Reanudar publicidad BLE
  }
};

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Iniciar sensores
  Wire.begin(SDA_PIN, SCL_PIN);
  dht.begin();
  lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);

  Serial.println("Iniciando BLE...");
  BLEDevice::init("ESP32_SENSORS");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());  // ← Añadimos los callbacks

  BLEService *pService = pServer->createService(SERVICE_UUID);

  tempChar = pService->createCharacteristic(TEMP_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  humChar  = pService->createCharacteristic(HUM_UUID,  BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  luxChar  = pService->createCharacteristic(LUX_UUID,  BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  soilChar = pService->createCharacteristic(SOIL_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);

  // Inicializar con valores por defecto
  tempChar->setValue("0.0");
  humChar->setValue("0.0");
  luxChar->setValue("0.0");
  soilChar->setValue("0");

  pService->start();

  // Publicar nombre + servicio en el advertising BLE
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->start();

  Serial.println("BLE iniciado y anunciándose.");
}

void loop() {
  float temperatura = dht.readTemperature();
  float humedad = dht.readHumidity();
  float luz = lightMeter.readLightLevel();
  int humedadSuelo = analogRead(HUMEDAD_SUELO_PIN);

  if (!isnan(temperatura)) tempChar->setValue(String(temperatura).c_str());
  if (!isnan(humedad))     humChar->setValue(String(humedad).c_str());
  if (!isnan(luz))         luxChar->setValue(String(luz).c_str());
  soilChar->setValue(String(humedadSuelo).c_str());

  Serial.println("Valores enviados por BLE:");
  Serial.printf("Temp: %.1f °C | Hum: %.1f %% | Luz: %.1f lux | Suelo: %d\n",
                temperatura, humedad, luz, humedadSuelo);
  Serial.println("-----------------------------");

  delay(10000);
}
