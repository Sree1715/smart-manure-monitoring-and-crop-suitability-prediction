/**
 * =========================================================================================
 * GOBARdhan Smart Manure Monitoring System - ESP32 Firmware
 * Board: ESP32-WROOM-32 DevKit (Arduino Framework)
 * 
 * IMPORTANT ARCHITECTURAL CONSTRAINTS:
 * 1. ADC1 PINS ONLY FOR ANALOG SENSORS:
 *    On ESP32, ADC2 channels cannot be used concurrently with WiFi because WiFi hardware 
 *    uses ADC2 internally. All analog inputs MUST be mapped to ADC1 pins:
 *    (GPIO 32, GPIO 33, GPIO 34, GPIO 35, GPIO 36 / VP, GPIO 39 / VN).
 * 
 * 2. MODULAR & REPLACEABLE SENSOR FUNCTIONS:
 *    Each sensor read is completely isolated in its own function so hardware probes 
 *    can be swapped without altering ingest logic.
 * 
 * 3. LAB / MANUAL PARAMETERS:
 *    - organic_carbon_pct is NOT read by a live sensor. It is tested in a lab or entered 
 *      manually by the farmer/operator on the web dashboard.
 *    - npk_index is computed server-side in the FastAPI backend from N, P, K using 
 *      the agronomic formula defined in config.
 * =========================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>      // Install ArduinoJson v6 or v7 via Library Manager
#include <OneWire.h>          // OneWire library for DS18B20
#include <DallasTemperature.h>// DallasTemperature library

// =========================================================================================
// NETWORK & BACKEND CONFIGURATION
// =========================================================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// FastAPI server ingest endpoint
const char* SERVER_INGEST_URL = "http://192.168.1.100:8000/api/readings/ingest";

// Unique Device Key generated during device registration in the backend
const char* DEVICE_API_KEY    = "dev_key_esp32_101";

// Reading intervals (in milliseconds)
const unsigned long SAMPLING_INTERVAL_MS = 60000; // Send sample every 60 seconds
unsigned long lastSampleTime = 0;

// =========================================================================================
// PIN DEFINITIONS (ESP32-WROOM-32)
// =========================================================================================
// Analog Sensors (STRICTLY ADC1 Pins):
#define PIN_PH_ANALOG        34    // ADC1_CH6: Analog pH probe (Liquid manure only)
#define PIN_MOISTURE_ANALOG  35    // ADC1_CH7: Capacitive Soil/Manure Moisture Sensor (Solid manure only)

// Digital 1-Wire Temperature Sensor:
#define PIN_ONE_WIRE_BUS     4     // GPIO 4: DS18B20 digital temperature bus

// RS485 / MAX485 Modbus NPK Sensor:
#define PIN_RS485_RX         16    // Serial2 RX (RO pin on MAX485)
#define PIN_RS485_TX         17    // Serial2 TX (DI pin on MAX485)
#define PIN_RS485_DE_RE      5     // GPIO 5: Combined Driver Enable & Receiver Enable (DE/RE)

// Setup DS18B20 OneWire instances
OneWire oneWire(PIN_ONE_WIRE_BUS);
DallasTemperature tempSensors(&oneWire);

// Setup HardwareSerial for RS485 Modbus
HardwareSerial ModbusSerial(2);

// =========================================================================================
// REPLACEABLE SENSOR READ FUNCTIONS
// =========================================================================================

/**
 * 1. Read Analog pH Probe (Liquid manure only)
 * Uses ADC1 pin (GPIO 34). Calibrate voltage using standard buffer solutions (pH 4.01 & 6.86).
 */
float read_analog_ph() {
    const int SAMPLES = 10;
    int rawSum = 0;
    for (int i = 0; i < SAMPLES; i++) {
        rawSum += analogRead(PIN_PH_ANALOG);
        delay(10);
    }
    float rawAvg = (float)rawSum / SAMPLES;

    // Convert 12-bit ADC (0 - 4095) to Voltage (0 - 3.3V)
    float voltage = (rawAvg / 4095.0) * 3.3;

    // Calibration linear transformation: pH = 7.0 + ((V_neutral - V) * slope)
    // Note: Calibrate V_NEUTRAL (typical 1.65V) and SLOPE for specific analog probe
    const float V_NEUTRAL = 1.65;
    const float SLOPE = 3.5;
    float ph = 7.0 + ((V_NEUTRAL - voltage) * SLOPE);

    // Physical clamp: 0.0 to 14.0
    if (ph < 0.0) ph = 0.0;
    if (ph > 14.0) ph = 14.0;

    Serial.printf("[SENSOR] Analog pH: Raw=%0.0f, Voltage=%0.2fV, pH=%0.2f\n", rawAvg, voltage, ph);
    return ph;
}

/**
 * 2. Read Capacitive Moisture Sensor (Solid manure only)
 * Uses ADC1 pin (GPIO 35).
 */
float read_capacitive_moisture() {
    const int SAMPLES = 10;
    int rawSum = 0;
    for (int i = 0; i < SAMPLES; i++) {
        rawSum += analogRead(PIN_MOISTURE_ANALOG);
        delay(10);
    }
    float rawAvg = (float)rawSum / SAMPLES;

    // Calibration thresholds:
    // DRY_VALUE in open air (~3200), WET_VALUE submerged in water (~1400)
    const float DRY_VALUE = 3200.0;
    const float WET_VALUE = 1400.0;

    float moisturePct = ((DRY_VALUE - rawAvg) / (DRY_VALUE - WET_VALUE)) * 100.0;
    if (moisturePct < 0.0) moisturePct = 0.0;
    if (moisturePct > 100.0) moisturePct = 100.0;

    Serial.printf("[SENSOR] Capacitive Moisture: Raw=%0.0f, Moisture=%0.1f%%\n", rawAvg, moisturePct);
    return moisturePct;
}

/**
 * 3. Read DS18B20 Digital Temperature Probe
 * Digital 1-Wire on GPIO 4.
 */
float read_ds18b20_temperature() {
    tempSensors.requestTemperatures();
    float tempC = tempSensors.getTempCByIndex(0);

    // Handle sensor disconnected condition (-127C)
    if (tempC == DEVICE_DISCONNECTED_C || tempC < -50.0) {
        Serial.println("[SENSOR] Warning: DS18B20 sensor disconnected or error. Returning default 25.0 C.");
        return 25.0;
    }

    Serial.printf("[SENSOR] DS18B20 Temperature: %0.1f C\n", tempC);
    return tempC;
}

/**
 * 4. Read RS485 NPK Sensor via MAX485 (Modbus RTU placeholder register queries)
 * Sends Modbus RTU query frame for Nitrogen, Phosphorus, Potassium registers.
 * Register addresses: 0x001E (N), 0x001F (P), 0x0020 (K) as standard industry placeholders.
 */
bool read_rs485_npk(float &n_pct, float &p_pct, float &k_pct) {
    // Enable RS485 Transmitter
    digitalWrite(PIN_RS485_DE_RE, HIGH);
    delay(5);

    // Standard Modbus RTU Request for NPK Sensor (Slave 0x01, Function 0x03, Start 0x001E, Count 3)
    // Query bytes: [SlaveID, Func, StartHigh, StartLow, CountHigh, CountLow, CRCLow, CRCHigh]
    const byte npkQueryFrame[] = { 0x01, 0x03, 0x00, 0x1E, 0x00, 0x03, 0x65, 0xCD };
    ModbusSerial.write(npkQueryFrame, sizeof(npkQueryFrame));
    ModbusSerial.flush();

    // Switch back to Receiver Mode
    digitalWrite(PIN_RS485_DE_RE, LOW);
    delay(50); // Wait for response frame

    byte response[11];
    int bytesRead = 0;
    unsigned long startTime = millis();

    while (millis() - startTime < 300 && bytesRead < 11) {
        if (ModbusSerial.available()) {
            response[bytesRead++] = ModbusSerial.read();
        }
    }

    if (bytesRead >= 11 && response[0] == 0x01 && response[1] == 0x03) {
        // Parse registers (typically returned in mg/kg or index, converted to % equivalent)
        int rawN = (response[3] << 8) | response[4];
        int rawP = (response[5] << 8) | response[6];
        int rawK = (response[7] << 8) | response[8];

        // Convert mg/kg to % (10,000 mg/kg = 1.0%)
        n_pct = (float)rawN / 1000.0;
        p_pct = (float)rawP / 1000.0;
        k_pct = (float)rawK / 1000.0;
        Serial.printf("[SENSOR] RS485 Modbus NPK Read: N=%0.2f%%, P=%0.2f%%, K=%0.2f%%\n", n_pct, p_pct, k_pct);
        return true;
    } else {
        // Fallback / simulation placeholder values if sensor is in lab testing mode
        Serial.println("[SENSOR] RS485 Modbus query timed out or simulation mode. Using fallback values.");
        n_pct = 1.45;
        p_pct = 0.78;
        k_pct = 1.15;
        return false;
    }
}

// =========================================================================================
// TRANSMIT TO FASTAPI BACKEND
// =========================================================================================
void post_reading_to_backend(const char* manure_type, float ph, float moisture, float temp, float n, float p, float k) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[NET] WiFi not connected. Cannot send data.");
        return;
    }

    HTTPClient http;
    http.begin(SERVER_INGEST_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Key", DEVICE_API_KEY);

    // Build JSON payload
    StaticJsonDocument<256> doc;
    doc["device_id"] = 1; // Device ID mapped to device_key in database
    doc["manure_type"] = manure_type;
    doc["temperature_c"] = round(temp * 10) / 10.0;

    if (strcmp(manure_type, "liquid") == 0) {
        doc["ph"] = round(ph * 100) / 100.0;
        doc["nitrogen_pct"] = round(n * 1000) / 1000.0;
        doc["phosphorus_pct"] = round(p * 1000) / 1000.0;
        doc["potassium_pct"] = round(k * 1000) / 1000.0;
    } else {
        doc["moisture_pct"] = round(moisture * 10) / 10.0;
        doc["nitrogen_pct"] = round(n * 1000) / 1000.0;
        doc["phosphorus_pct"] = round(p * 1000) / 1000.0;
        doc["potassium_pct"] = round(k * 1000) / 1000.0;
        // NOTE: organic_carbon_pct is manual/lab-entered in web UI, not live sensor.
    }

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.printf("[NET] Sending POST to %s with payload: %s\n", SERVER_INGEST_URL, requestBody.c_str());
    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.printf("[NET] Response Code: %d | Body: %s\n", httpResponseCode, response.c_str());
    } else {
        Serial.printf("[NET] HTTP POST failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
    }

    http.end();
}

// =========================================================================================
// ARDUINO SETUP & LOOP
// =========================================================================================
void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n--- GOBARdhan ESP32 Manure Monitoring Node Initializing ---");

    // Configure ADC resolution (12-bit = 0 to 4095)
    analogReadResolution(12);
    // 11dB attenuation gives approx 0 - 3.3V full-scale range
    analogSetPinAttenuation(PIN_PH_ANALOG, ADC_11db);
    analogSetPinAttenuation(PIN_MOISTURE_ANALOG, ADC_11db);

    // Initialize 1-Wire Temperature
    tempSensors.begin();

    // Initialize RS485 MAX485
    pinMode(PIN_RS485_DE_RE, OUTPUT);
    digitalWrite(PIN_RS485_DE_RE, LOW); // Default to RX mode
    ModbusSerial.begin(9600, SERIAL_8N1, PIN_RS485_RX, PIN_RS485_TX);

    // Connect to WiFi
    Serial.printf("[WIFI] Connecting to %s...", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WIFI] Connected! IP Address: %s\n", WiFi.localIP().toString().c_str());
    } else {
        Serial.println("\n[WIFI] Connection failed. Continuing in local testing mode.");
    }
}

void loop() {
    unsigned long currentMillis = millis();
    if (currentMillis - lastSampleTime >= SAMPLING_INTERVAL_MS || lastSampleTime == 0) {
        lastSampleTime = currentMillis;

        Serial.println("\n--- Performing Sensor Acquisition Cycle ---");

        // 1. Read liquid pH (analog, ADC1)
        float ph = read_analog_ph();

        // 2. Read solid moisture (capacitive, ADC1)
        float moisture = read_capacitive_moisture();

        // 3. Read temperature (digital 1-wire DS18B20)
        float temp = read_ds18b20_temperature();

        // 4. Read NPK via RS485 MAX485 Modbus
        float n = 0, p = 0, k = 0;
        read_rs485_npk(n, p, k);

        // Send Liquid Manure Sample
        post_reading_to_backend("liquid", ph, moisture, temp, n, p, k);

        delay(1500);

        // Send Solid Manure Sample
        post_reading_to_backend("solid", ph, moisture, temp, n, p, k);
    }

    delay(100);
}
