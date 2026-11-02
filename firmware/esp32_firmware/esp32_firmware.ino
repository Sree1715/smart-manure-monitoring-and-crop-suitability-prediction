/**
 * =========================================================================================
 * GOBARdhan Smart Manure Monitoring System — ESP32 Firmware
 * Version: 2.0  (Hardware Integration Build)
 *
 * Board:   ESP32-WROOM-32 DevKit
 * Author:  Crop Monitoring DT Project
 * 
 * ── ACTUAL HARDWARE (your setup) ──────────────────────────────────────────────────────
 *  MOISTURE SENSOR (HW-080 resistive probe + HW-103 interface module)
 *    VCC  → ESP32 3.3V
 *    GND  → ESP32 GND
 *    AO   → GPIO 34  (ADC1 channel — safe with WiFi)
 *    DO   → not connected
 *
 *  TEMPERATURE SENSOR (DS18B20 waterproof, OneWire digital)
 *    Red    → 3.3V
 *    Black  → GND
 *    Yellow → GPIO 4
 *    4.7kΩ resistor between DATA (Yellow) and 3.3V
 *
 * ── REQUIRED LIBRARIES (install via Arduino IDE → Tools → Manage Libraries) ──────────
 *  1. ArduinoJson   by Benoit Blanchon  (version 6.x or 7.x)
 *  2. OneWire       by Jim Studt        (latest)
 *  3. DallasTemperature by Miles Burton (latest)
 *  4. WiFiClientSecure  (built into ESP32 Arduino core, no install needed)
 *
 * ── HOW IT WORKS ─────────────────────────────────────────────────────────────────────
 *  1. Connects to your Wi-Fi hotspot.
 *  2. Reads moisture (GPIO 34 raw ADC) and temperature (GPIO 4 DS18B20) every 60 seconds.
 *  3. Sends both values to your deployed backend via HTTPS POST.
 *  4. Backend converts the raw ADC to a moisture percentage using calibration constants.
 *  5. Backend combines the reading with the NPK values your farmer entered on the website.
 *
 * ── BEFORE FLASHING ──────────────────────────────────────────────────────────────────
 *  Fill in the CONFIGURATION section below:
 *    WIFI_SSID       — your mobile hotspot name (2.4 GHz only)
 *    WIFI_PASSWORD   — your hotspot password
 *    DEVICE_API_KEY  — the api_key returned when you registered your device on the site
 *    SERVER_HOST     — your Render backend hostname (no https://, no trailing slash)
 * =========================================================================================
 */

// ── Required Libraries ────────────────────────────────────────────────────────────────
#include <WiFi.h>
#include <WiFiClientSecure.h>   // for HTTPS
#include <HTTPClient.h>
#include <ArduinoJson.h>        // v6 or v7
#include <OneWire.h>
#include <DallasTemperature.h>

// =========================================================================================
// CONFIGURATION — FILL THESE IN BEFORE FLASHING
// =========================================================================================

// ── Wi-Fi (use your 2.4 GHz mobile hotspot) ──────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_HOTSPOT_NAME";     // ← Replace with your hotspot name
const char* WIFI_PASSWORD = "YOUR_HOTSPOT_PASSWORD"; // ← Replace with your hotspot password

// ── Backend API ───────────────────────────────────────────────────────────────────────
// Your Render backend hostname WITHOUT https:// and WITHOUT trailing slash.
// Example: "smart-manure-backend.onrender.com"
const char* SERVER_HOST = "smart-manure-backend.onrender.com"; // ← Replace with your actual Render URL

// The full HTTPS ingest endpoint path
const char* INGEST_PATH = "/api/readings/ingest";

// ── Device Authentication ─────────────────────────────────────────────────────────────
// Paste the api_key you received when you registered your device on the website.
// It looks like: dev_key_a1b2c3d4e5f6...
// IMPORTANT: Keep this secret. Do not share it or commit it to public Git repositories.
const char* DEVICE_API_KEY = "dev_key_PASTE_YOUR_KEY_HERE"; // ← Replace with your device API key

// =========================================================================================
// HARDWARE PIN DEFINITIONS — DO NOT CHANGE (matches your actual wiring)
// =========================================================================================
#define PIN_MOISTURE_ANALOG   34   // GPIO 34 → AO of HW-103 module (ADC1 — safe with WiFi)
#define PIN_ONE_WIRE_BUS       4   // GPIO 4  → Yellow wire of DS18B20 (with 4.7kΩ pull-up)

// =========================================================================================
// SAMPLING INTERVAL
// =========================================================================================
// How often to read sensors and send data (milliseconds).
// 60000 = every 60 seconds. Change to 30000 for every 30 seconds.
const unsigned long SAMPLING_INTERVAL_MS = 60000UL;
unsigned long lastSampleTime = 0;

// =========================================================================================
// DS18B20 SETUP
// =========================================================================================
OneWire oneWire(PIN_ONE_WIRE_BUS);
DallasTemperature tempSensors(&oneWire);

// =========================================================================================
// MOISTURE READING — HW-080 Resistive Probe on GPIO 34
// =========================================================================================
/**
 * Reads the HW-080 resistive moisture probe.
 * 
 * Takes 15 samples and returns the AVERAGE raw ADC value (0–4095).
 * We send the raw value to the backend, which converts it to a percentage
 * using your calibration constants (set during calibration mode).
 * 
 * Why raw ADC and not % here?
 *   Because calibration constants are stored on the server.
 *   This way you can update calibration without reflashing the firmware.
 */
int read_moisture_raw() {
    const int SAMPLES = 15;
    long rawSum = 0;
    for (int i = 0; i < SAMPLES; i++) {
        rawSum += analogRead(PIN_MOISTURE_ANALOG);
        delay(10);
    }
    int rawAvg = (int)(rawSum / SAMPLES);
    Serial.printf("[SENSOR] Moisture ADC: Raw=%d (averaged over %d samples)\n", rawAvg, SAMPLES);
    return rawAvg;
}

// =========================================================================================
// TEMPERATURE READING — DS18B20 on GPIO 4
// =========================================================================================
/**
 * Reads temperature from the DS18B20 waterproof sensor.
 * Returns temperature in Celsius.
 * If sensor is disconnected, returns -127.0 (which the backend will reject cleanly).
 */
float read_temperature() {
    tempSensors.requestTemperatures();
    delay(100); // Allow DS18B20 conversion time (750ms for 12-bit, 100ms is safe for 9-bit default)
    float tempC = tempSensors.getTempCByIndex(0);

    if (tempC == DEVICE_DISCONNECTED_C || tempC < -55.0 || tempC > 125.0) {
        Serial.println("[SENSOR] ERROR: DS18B20 disconnected or out of range. Check wiring and 4.7kΩ pull-up resistor.");
        return -127.0;
    }

    Serial.printf("[SENSOR] DS18B20 Temperature: %.1f°C\n", tempC);
    return tempC;
}

// =========================================================================================
// Wi-Fi CONNECTION
// =========================================================================================
void connect_wifi() {
    if (WiFi.status() == WL_CONNECTED) return;

    Serial.printf("[WiFi] Connecting to '%s'", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 40) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WiFi] ✓ Connected! IP: %s  Signal: %d dBm\n",
                      WiFi.localIP().toString().c_str(), WiFi.RSSI());
    } else {
        Serial.println("\n[WiFi] ✗ Connection FAILED. Will retry on next cycle.");
        Serial.printf("       SSID: '%s' — Make sure it is a 2.4 GHz network and the password is correct.\n", WIFI_SSID);
    }
}

// =========================================================================================
// SEND READING TO BACKEND (HTTPS POST)
// =========================================================================================
/**
 * Sends the moisture raw ADC value and temperature to the backend via HTTPS.
 * 
 * JSON body sent:
 *   {
 *     "moisture_raw_adc": 1847,
 *     "temperature_c": 29.5
 *   }
 * 
 * Header:
 *   X-Device-Key: dev_key_xxxxxxxxxxxxxxxx
 */
void send_reading_to_backend(int moisture_raw, float temperature_c) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[NET] ✗ Not connected to Wi-Fi. Skipping this transmission.");
        return;
    }

    // Validate sensor readings before sending
    if (temperature_c < -55.0 || temperature_c > 125.0) {
        Serial.println("[NET] ✗ Invalid temperature reading. Skipping transmission to protect data integrity.");
        return;
    }
    if (moisture_raw < 0 || moisture_raw > 4095) {
        Serial.println("[NET] ✗ Invalid moisture ADC value. Skipping transmission.");
        return;
    }

    // Build JSON payload
    StaticJsonDocument<128> doc;
    doc["moisture_raw_adc"] = moisture_raw;
    doc["temperature_c"]    = round(temperature_c * 10.0) / 10.0; // 1 decimal place

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.printf("[NET] → Sending to https://%s%s\n", SERVER_HOST, INGEST_PATH);
    Serial.printf("[NET]   Payload: %s\n", requestBody.c_str());

    // Use WiFiClientSecure for HTTPS
    // setInsecure() skips certificate verification — acceptable for IoT on trusted networks.
    // For maximum security, load your backend's root CA certificate here.
    WiFiClientSecure client;
    client.setInsecure();
    client.setTimeout(15000); // 15 second timeout

    HTTPClient http;
    String url = String("https://") + SERVER_HOST + INGEST_PATH;
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Key", DEVICE_API_KEY);
    http.setTimeout(15000);

    int httpCode = http.POST(requestBody);

    if (httpCode > 0) {
        String response = http.getString();
        if (httpCode == 200 || httpCode == 201) {
            Serial.printf("[NET] ✓ Success! Response Code: %d\n", httpCode);
            Serial.printf("[NET]   Response: %s\n", response.c_str());

            // Parse and display key result values
            StaticJsonDocument<512> resDoc;
            DeserializationError err = deserializeJson(resDoc, response);
            if (!err) {
                bool linked = resDoc["session_linked"] | false;
                float moisture_pct = resDoc["values"]["moisture_pct"] | -1.0f;
                float temp_back = resDoc["values"]["temperature_c"] | -1.0f;
                int reading_id = resDoc["reading_id"] | -1;

                Serial.println("[NET] ─── Server Processed Values ───────────────────");
                Serial.printf("[NET]   Reading ID    : %d\n", reading_id);
                Serial.printf("[NET]   Moisture %%     : %.1f%%\n", moisture_pct);
                Serial.printf("[NET]   Temperature   : %.1f°C\n", temp_back);
                Serial.printf("[NET]   Session linked: %s\n", linked ? "YES (NPK values included)" : "NO (no active session)");
                if (!linked) {
                    Serial.println("[NET]   ⚠ Ask the farmer to open a Measurement Session on the website first!");
                }
                Serial.println("[NET] ──────────────────────────────────────────────");
            }
        } else {
            Serial.printf("[NET] ✗ Server returned error. Code: %d\n", httpCode);
            Serial.printf("[NET]   Response: %s\n", response.c_str());

            if (httpCode == 401) {
                Serial.println("[NET]   → Check your DEVICE_API_KEY. It may be wrong or the device is not registered.");
            } else if (httpCode == 422) {
                Serial.println("[NET]   → Server rejected the data format. Check JSON payload.");
            } else if (httpCode == 503 || httpCode == 0) {
                Serial.println("[NET]   → Backend may be starting up (Render free tier sleeps). Retrying next cycle.");
            }
        }
    } else {
        Serial.printf("[NET] ✗ HTTP POST failed. Error: %s\n", http.errorToString(httpCode).c_str());
        Serial.println("[NET]   Possible causes:");
        Serial.println("[NET]   - Backend is offline or URL is wrong");
        Serial.println("[NET]   - Wi-Fi connection was lost mid-request");
        Serial.println("[NET]   - SSL handshake failed (retry usually fixes this)");
    }

    http.end();
}

// =========================================================================================
// SETUP
// =========================================================================================
void setup() {
    Serial.begin(115200);
    delay(1500);

    Serial.println("\n");
    Serial.println("╔══════════════════════════════════════════════════════╗");
    Serial.println("║  GOBARdhan ESP32 Manure Monitoring Node  v2.0        ║");
    Serial.println("║  Smart Organic Manure Analysis                       ║");
    Serial.println("╚══════════════════════════════════════════════════════╝");
    Serial.println();

    // ── ADC Configuration ──────────────────────────────────────────────────
    // 12-bit resolution: values from 0 to 4095
    // 11 dB attenuation: full-scale range 0 – ~3.3V (required for GPIO 34)
    analogReadResolution(12);
    analogSetPinAttenuation(PIN_MOISTURE_ANALOG, ADC_11db);
    Serial.printf("[INIT] GPIO %d configured for moisture ADC (12-bit, 11dB atten)\n", PIN_MOISTURE_ANALOG);

    // ── DS18B20 Initialization ─────────────────────────────────────────────
    tempSensors.begin();
    int sensorCount = tempSensors.getDeviceCount();
    Serial.printf("[INIT] DS18B20 sensors found: %d (on GPIO %d)\n", sensorCount, PIN_ONE_WIRE_BUS);
    if (sensorCount == 0) {
        Serial.println("[INIT] ⚠ WARNING: No DS18B20 found! Check:");
        Serial.println("[INIT]   - Yellow wire connected to GPIO 4");
        Serial.println("[INIT]   - 4.7kΩ resistor between DATA (yellow) and 3.3V");
        Serial.println("[INIT]   - Red wire to 3.3V, Black wire to GND");
    }

    // ── Wi-Fi Connection ───────────────────────────────────────────────────
    connect_wifi();

    Serial.println("\n[INIT] ✓ Initialization complete. Starting measurement loop.");
    Serial.printf("[INIT]   Sampling interval: %lu ms (%lu seconds)\n",
                  SAMPLING_INTERVAL_MS, SAMPLING_INTERVAL_MS / 1000);
    Serial.println("[INIT]   Sending to: https://" + String(SERVER_HOST) + INGEST_PATH);
    Serial.println();
}

// =========================================================================================
// MAIN LOOP
// =========================================================================================
void loop() {
    unsigned long now = millis();

    // Send immediately on first run (lastSampleTime == 0), then every SAMPLING_INTERVAL_MS
    if (lastSampleTime == 0 || (now - lastSampleTime) >= SAMPLING_INTERVAL_MS) {
        lastSampleTime = now;

        Serial.println("\n══════════════════ Sensor Acquisition Cycle ══════════════════");

        // ── Reconnect Wi-Fi if dropped ─────────────────────────────────────
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("[WiFi] Connection lost. Attempting reconnect...");
            connect_wifi();
        }

        // ── Read Sensors ───────────────────────────────────────────────────
        int   moisture_raw = read_moisture_raw();
        float temperature  = read_temperature();

        // ── Send to Backend ────────────────────────────────────────────────
        send_reading_to_backend(moisture_raw, temperature);

        Serial.println("══════════════════════════════════════════════════════════════\n");
    }

    delay(100);
}

// =========================================================================================
// HOW TO USE — CALIBRATION INSTRUCTIONS
// =========================================================================================
/**
 * STEP 1 — CALIBRATION (do this ONCE after setting up the sensor)
 * ─────────────────────────────────────────────────────────────────
 * The HW-080 resistive probe needs calibration to give accurate percentages.
 *
 * a) DRY calibration (get the dry_adc value):
 *    - Hold the probe in open air (completely dry, not touching anything).
 *    - Watch the Serial Monitor. The "Moisture ADC: Raw=XXXX" value shown is your dry_adc.
 *    - Typical range: 3000–4000.
 *
 * b) WET calibration (get the wet_adc value):
 *    - Insert the probe fully into wet manure OR a cup of water.
 *    - Watch the Serial Monitor. The ADC value shown is your wet_adc.
 *    - Typical range: 500–1500.
 *
 * c) Update calibration on the backend:
 *    Go to: https://<YOUR_RENDER_BACKEND>/docs
 *    Use POST /api/devices/{device_id}/calibrate
 *    Body: { "dry_adc": XXXX, "wet_adc": YYYY }
 *    Header: X-Device-Key: dev_key_your_key_here
 *
 * ─────────────────────────────────────────────────────────────────
 * STEP 2 — NORMAL OPERATION
 * ─────────────────────────────────────────────────────────────────
 * 1. Farmer logs into the website.
 * 2. Farmer enters N, P, K values and clicks "Start Measurement Session".
 * 3. ESP32 reads moisture + temperature and sends to backend.
 * 4. Backend combines both → complete reading stored.
 * 5. Authority dashboard shows the full record with all 5 parameters.
 */
