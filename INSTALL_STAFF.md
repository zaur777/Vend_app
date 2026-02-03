# Setup Guide: Merchandiser Portal

This portal is optimized for field service staff using mobile tablets to restock machines.

## 1. Access Configuration
The Merchandiser Portal is accessed via the web browser on any mobile device.

**URL:** `https://your-domain.com?mode=staff`

## 2. Local Network Sync (On-Site)
When a staff member is physically at a machine, they can sync directly with the LB-140 board over the local network (VPN recommended).

1. Connect tablet to Machine Local Wi-Fi (if provided).
2. Use the **"Sync LB-140"** button to perform a hardware handshake.
3. This triggers a `0x53` (STATUS) and `0x4D` (MOTOR_TEST) command sequence.

## 3. Features for Staff
- **Visual Matrix:** 60-slot grid mirroring the physical machine layout.
- **Bulk Refill:** One-tap replenishment to max capacity.
- **Service Logs:** Real-time logging of door opens and inventory changes.

## 4. Mobile Installation (PWA)
To install as a mobile app:
1. Open Chrome on Android or Safari on iOS.
2. Navigate to the staff URL.
3. Select **"Add to Home Screen"**.
4. The app will now launch in full-screen standalone mode without browser chrome.