# ESP32 Firmware Documentation — GOBARdhan Smart Manure Monitor

## Hardware Architecture & Board
- **Microcontroller**: ESP32-WROOM-32 DevKit (30 or 38 pin)
- **Framework**: Arduino Framework (C++)

---

## ⚠️ Critical ESP32 ADC Restriction
> **ADC1 PINS ONLY FOR ANALOG SENSORS**
> On ESP32 microcontrollers, the ADC peripheral is split into **ADC1** (GPIO 32, 33, 34, 35, 36, 39) and **ADC2** (GPIO 0, 2, 4, 12, 13, 14, 15, 25, 26, 27).
> The **WiFi driver uses ADC2 internally**. When WiFi is active, any `analogRead()` calls on ADC2 channels will fail or return invalid/erratic values.
> Therefore:
> - **Analog pH probe**: Connected to **GPIO 34 (ADC1_CH6)**.
> - **Capacitive Moisture probe**: Connected to **GPIO 35 (ADC1_CH7)**.
> - Under no circumstances should analog sensors be connected to ADC2.

---

## Pinout & Wiring Table

| Sensor / Module | Interface | ESP32 Pin | Note |
|---|---|---|---|
| **Analog pH Probe** | Analog Voltage (0–3.3V) | **GPIO 34 (ADC1_CH6)** | Liquid manure monitoring only |
| **Capacitive Moisture** | Analog Voltage (0–3.3V) | **GPIO 35 (ADC1_CH7)** | Solid manure monitoring only |
| **DS18B20 Temp Probe** | 1-Wire Digital Bus | **GPIO 4** | Requires 4.7kΩ pullup to 3.3V |
| **MAX485 Transceiver (RO)** | UART2 RX | **GPIO 16** | RS485 Read Output |
| **MAX485 Transceiver (DI)** | UART2 TX | **GPIO 17** | RS485 Driver Input |
| **MAX485 (DE & RE)** | Digital Output | **GPIO 5** | Driver / Receiver Enable |

---

## Replaceable Function Structure

Each sensor read operation is isolated into an independent, modular function inside `esp32_firmware.ino`:

1. `float read_analog_ph()`:
   Samples analog voltage with 12-bit ADC, applies neutral voltage offset and probe slope calibration.
2. `float read_capacitive_moisture()`:
   Reads capacitance-based analog voltage, normalizes between air (dry) and water (wet) calibration values to return percentage (0–100%).
3. `float read_ds18b20_temperature()`:
   Polls Dallas 1-Wire digital temperature bus, detects disconnect condition (-127°C fallback).
4. `bool read_rs485_npk(float &n, float &p, float &k)`:
   Constructs Modbus RTU inquiry frame (Slave 0x01, Function 0x03, Register 0x001E, 3 registers), sends via MAX485, parses return bytes into elemental percentages.

---

## Lab vs Live Parameters
- **`organic_carbon_pct`**: NOT a live sensor. Organic carbon requires Walkley-Black wet oxidation or dry combustion in a certified soil/compost testing laboratory. Farmers or lab operators manually submit this parameter through the web dashboard.
- **`npk_index`**: NOT computed on the microcontroller. It is computed in the FastAPI backend from live Nitrogen, Phosphorus, and Potassium readings using the documented agronomic index formula in `backend/app/core/config.py`.

---

## HTTP Ingestion Protocol
The ESP32 issues an HTTP `POST` request to `/api/readings/ingest`:
- Header: `X-Device-Key: dev_key_esp32_101`
- Content-Type: `application/json`
- Payload:
  ```json
  {
    "device_id": 1,
    "manure_type": "liquid",
    "ph": 6.85,
    "nitrogen_pct": 1.45,
    "phosphorus_pct": 0.78,
    "potassium_pct": 1.15,
    "temperature_c": 28.5
  }
  ```
