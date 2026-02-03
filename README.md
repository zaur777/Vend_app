# VendMaster Pro: Infrastructure Suite

Enterprise-grade vending management divided into three specialized operational tracks.

## 📖 Installation Guides
To set up the system, please follow the specific guide for your deployment target:

1.  **[Kiosk Installation Guide (Raspberry Pi 4)](./INSTALL_KIOSK.md)**
    *   *Target:* Physical machines with 32" touchscreens and LB-140 boards.
    *   *Focus:* Hardware wiring, GPIO, Serial communication, and Kiosk OS setup.

2.  **[Admin Deployment Guide (Enterprise Web)](./INSTALL_ADMIN.md)**
    *   *Target:* Centralized cloud servers or local management terminals.
    *   *Focus:* Fleet-wide PostgreSQL database, Gemini AI configuration, and security.

3.  **[Merchandiser Setup Guide (Staff Mobile)](./INSTALL_STAFF.md)**
    *   *Target:* Service staff tablets and mobile devices.
    *   *Focus:* Inventory management, mobile-optimized stocking, and PWA setup.

## 🗄️ Database Setup
The system requires a relational database (PostgreSQL recommended for production) to manage the global state.

```sql
-- Initial Schema Setup
CREATE TABLE machines (id VARCHAR(20) PRIMARY KEY, location TEXT, status VARCHAR(20), last_sync TIMESTAMP);
CREATE TABLE inventory (slot_id INT, machine_id VARCHAR(20) REFERENCES machines(id), product_name TEXT, stock INT, max_stock INT);
CREATE TABLE transactions (id UUID PRIMARY KEY, machine_id VARCHAR(20), amount NUMERIC(10,2), timestamp TIMESTAMP DEFAULT NOW());
```

---
*© 2025 VendMaster Enterprise Systems. Confidential & Proprietary.*