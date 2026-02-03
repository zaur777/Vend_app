# VendMaster Pro: Deployment Guide

Comprehensive documentation for installing and configuring the VendMaster Pro fleet management software on a **Raspberry Pi 4** with an **LB-140 Control Board** and **32-inch Touchscreen**.

## 1. Hardware Prerequisites
- **Controller**: Raspberry Pi 4B (4GB+ RAM recommended).
- **Control Board**: LB-140 Vending Controller (MDB/DEX support).
- **Display**: 32" PCAP Touchscreen (1080p).
- **Power**: 24V DC PSU (for motors) + 5V 3A (for RPi4).
- **Level Shifter**: 3.3V to 5V Bi-directional converter (for UART protection).

## 2. Hardware Wiring (UART)
Connect the RPi4 GPIO to the LB-140 Serial Debug/Command Port (J5).

| RPi4 Pin | Label | Direction | LB-140 Pin |
| :--- | :--- | :--- | :--- |
| **Pin 8** | GPIO 14 (TX) | &rarr; | J5 - Pin 2 (RX) |
| **Pin 10** | GPIO 15 (RX) | &larr; | J5 - Pin 3 (TX) |
| **Pin 6** | GND | -- | J5 - Pin 5 (GND) |

*⚠️ **WARNING**: LB-140 uses 5V logic. You must use a level shifter on the RPi4 RX line (Pin 10) to prevent permanent damage to the 3.3V GPIO.*

## 3. Software Environment Setup

### Base OS Configuration
Install Raspberry Pi OS (64-bit). In `raspi-config`, enable Serial Port hardware but **disable** the Serial Console.

Edit `/boot/config.txt`:
```bash
enable_uart=1
dtoverlay=disable-bt
```

### Installation Commands
```bash
# Update and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm chromium-browser x11-xserver-utils xdotool unclutter

# Clone and install
git clone https://github.com/your-org/vendmaster-pro.git
cd vendmaster-pro
npm install
```

### Kiosk Mode Setup
Create an autostart file at `~/.config/lxsession/LXDE-pi/autostart`:
```text
@xset s off
@xset -dpms
@xset s noblank
@chromium-browser --kiosk --incognito --disable-infobars http://localhost:3000
```

## 4. Database Schema
For local edge persistence (on RPi), use **SQLite**. For central fleet management, use **PostgreSQL**.

```sql
-- Machine Master Table
CREATE TABLE machines (
  id VARCHAR(20) PRIMARY KEY,
  location TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'ONLINE',
  last_service TIMESTAMP,
  ip_address VARCHAR(45)
);

-- 60-Slot Motor Matrix
CREATE TABLE inventory (
  slot_id INT PRIMARY KEY, -- 1 to 60
  machine_id VARCHAR(20) REFERENCES machines(id),
  product_name TEXT,
  current_stock INT DEFAULT 0,
  max_capacity INT DEFAULT 20,
  price_cents INT
);

-- Transaction Ledger
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id VARCHAR(20) REFERENCES machines(id),
  slot_id INT,
  amount_cents INT,
  payment_status VARCHAR(20), -- 'SUCCESS', 'REFUNDED'
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 5. Environment Variables
Secure your Gemini API key in a `.env` file in the project root.

```env
API_KEY=your_google_gemini_api_key_here
LB140_PORT=/dev/ttyS0
DEBUG_MODE=false
```

## 6. Production Launch
Use PM2 to ensure the application restarts on crash or reboot:
```bash
sudo npm install -g pm2
pm2 start npm --name "vendmaster-ui" -- start
pm2 save
pm2 startup
```

---
*© 2025 VendMaster Enterprise Systems. All rights reserved.*
