# 💡 Smart Lighting System using Arduino Uno

A smart and energy-efficient lighting automation system built using **Arduino Uno**, **PIR Sensor**, **LDR Sensor**, **RTC Module**, and **Bluetooth Connectivity**. The system automatically controls room lighting based on motion detection, ambient light conditions, and time of day while also allowing manual control through a web dashboard and Bluetooth connection.

---

## 🚀 Features

### 🌞 Daytime Operation

* Detects ambient light using the LDR sensor.
* Keeps lights OFF during daytime even if motion is detected.
* Saves energy by preventing unnecessary lighting.

### 🌙 Nighttime Operation

* Uses RTC and LDR data to determine night conditions.
* Automatically turns ON the light when motion is detected by the PIR sensor.
* Automatically turns OFF the light after a specified period of inactivity.

### 📱 Smart Control

* Control lights through a web-based dashboard.
* Bluetooth connectivity for wireless communication.
* Supports connection to BLE modules and Bluetooth-enabled lighting devices.

### 🎉 Lighting Modes

#### Automatic Mode

Automatically controls lighting based on sensor inputs.

#### Sleep Mode

* Reduces brightness to a low level.
* Saves energy during nighttime.
* Maintains motion detection functionality.

#### Party Mode

* Creates blinking light effects.
* Adjustable blinking speed.
* Designed for entertainment and ambiance.

#### Reading Mode

* Provides stable bright illumination.
* Optimized for studying and reading.

#### Custom Mode

* User-defined brightness settings.
* Personalized lighting profiles.

---

## 🛠 Hardware Components

| Component                          | Quantity    |
| ---------------------------------- | ----------- |
| Arduino Uno                        | 1           |
| PIR Motion Sensor                  | 1           |
| LDR Sensor Module                  | 1           |
| RTC Module (DS3231)                | 1           |
| Bluetooth Module (BLE/HC-05/HM-10) | 1           |
| LED                                | 1           |
| 220Ω Resistor                      | 1           |
| Breadboard & Jumper Wires          | As Required |

---

## 🔌 Circuit Connections

| Component | Arduino Pin          |
| --------- | -------------------- |
| PIR OUT   | D2                   |
| PIR VCC   | 5V                   |
| PIR GND   | GND                  |
| LDR AO    | A0                   |
| LDR VCC   | 5V                   |
| LDR GND   | GND                  |
| RTC SDA   | A4                   |
| RTC SCL   | A5                   |
| RTC VCC   | 5V                   |
| RTC GND   | GND                  |
| LED (+)   | D9 (PWM Recommended) |
| LED (-)   | GND                  |

> Note: D9 is recommended instead of D8 to support brightness control using PWM.

---

## 🖥 Website Dashboard Features

* Real-time sensor monitoring
* Motion detection status
* Ambient light monitoring
* RTC clock display
* Bluetooth connection status
* LED brightness control
* Lighting mode selection
* Energy consumption analytics
* Notifications and activity logs
* Smart home visualization

---

## ⚙️ Working Principle

### Autonomous Operation

The system continues working even when the website or Bluetooth connection is unavailable.

#### Daytime

* LDR detects sufficient ambient light.
* LED remains OFF regardless of motion.

#### Nighttime

* LDR and RTC detect low-light conditions.
* PIR sensor monitors movement.
* Motion detected → LED ON.
* No motion for a predefined duration → LED OFF.

### Manual Override

When a user connects through the website or Bluetooth:

* Manual commands take priority.
* Lighting modes can be selected.
* Brightness can be adjusted remotely.

---

## 📊 Energy Monitoring

The system estimates energy consumption based on:

Energy (Wh) = Power Rating (W) × Runtime (Hours)

The dashboard displays:

* Estimated energy usage
* Runtime statistics
* Average brightness
* Energy saved through Sleep Mode

---

## 📡 Bluetooth Commands

| Command          | Function                |
| ---------------- | ----------------------- |
| ON               | Turn LED ON             |
| OFF              | Turn LED OFF            |
| AUTO             | Activate Automatic Mode |
| SLEEP            | Activate Sleep Mode     |
| PARTY            | Activate Party Mode     |
| READ             | Activate Reading Mode   |
| BRIGHTNESS:0-255 | Set LED Brightness      |

Example:

BRIGHTNESS:200

---

## 🧰 Software & Technologies

### Hardware Programming

* Arduino IDE
* C++

### Frontend

* HTML5
* CSS3
* JavaScript
* Bootstrap
* Chart.js
* Font Awesome

### Communication

* Serial Communication
* Bluetooth (BLE / HC-05 / HM-10)

### Backend (Future Integration)

* Flask
* REST APIs

---

## 📈 Future Improvements

* Mobile Application Integration
* Cloud-Based Monitoring
* IoT Dashboard with MQTT
* Voice Assistant Support
* Real-Time Power Measurement using INA219 or ACS712
* AI-Based Occupancy Prediction
* Smart Scheduling Features

---

## 🎯 Applications

* Smart Homes
* Offices
* Classrooms
* Libraries
* Energy Management Systems
* Building Automation

---

## 👨‍💻 Author

Developed as an Engineering Project on Smart Home Automation and Intelligent Lighting Control using Arduino and IoT Technologies.

---

## 📜 License

This project is open-source and available for educational and research purposes.
