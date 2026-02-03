# Installation Guide: User UI (Kiosk)

This guide covers the setup for the physical vending machine interface running on a Raspberry Pi 4.

## 1. Hardware Specification
- **Computing:** Raspberry Pi 4B (4GB+)
- **Storage:** 32GB High-Endurance MicroSD
- **Display:** 32-inch PCAP Touch (Portrait)
- **Controller:** LB-140 MDB Control Board

## 2. GPIO & UART Wiring
Connect the RPi4 to the LB-140 J5 header using a 3.3V/5V level shifter.

| RPi4 GPIO | Signal | LB-140 J5 |
| :--- | :--- | :--- |
| Pin 8 (TX) | Serial Data Out | Pin 2 (RX) |
| Pin 10 (RX) | Serial Data In | Pin 3 (TX) |
| Pin 6 (GND) | Common Ground | Pin 5 (GND) |

## 3. OS Optimization
1. Install **Raspberry Pi OS Lite (64-bit)**.
2. Run `sudo raspi-config`:
   - Interfacing Options > Serial Port:
     - Login Shell: **NO**
     - Hardware Serial: **YES**
3. Performance tuning in `/boot/config.txt`:
   ```text
   enable_uart=1
   dtoverlay=disable-bt
   display_rotate=1 # For Portrait orientation
   ```

## 4. Kiosk Mode Deployment
Install the kiosk dependencies:
```bash
sudo apt install -y xserver-xorg x11-xserver-utils xinit fluxbox chromium-browser
```

Create `~/.xinitrc`:
```bash
#!/bin/bash
xset s off
xset -dpms
xset s noblank
chromium-browser --kiosk --incognito http://localhost:3000?mode=kiosk
```

Start the interface:
```bash
startx
```