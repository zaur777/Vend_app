# Deployment Guide: Admin Dashboard

The Admin Dashboard is designed for fleet management and requires a centralized cloud or server environment.

## 1. Hosting Requirements
- **Runtime:** Node.js v18.x or higher
- **Database:** PostgreSQL v14+ (or SQLite for development)
- **Memory:** 1GB RAM minimum

## 2. Gemini AI Configuration
The dashboard uses Google Gemini for predictive maintenance.
1. Obtain an API Key from [Google AI Studio](https://aistudio.google.com/).
2. Create a `.env` file in the project root:
   ```env
   API_KEY=your_gemini_key_here
   DATABASE_URL=postgres://user:pass@host:5432/vendmaster
   ```

## 3. Database Migration
Run the following commands to initialize the fleet management schema:
```bash
# Example using psql
psql -d vendmaster -f schema.sql
```

## 4. Launch Instructions
```bash
npm install
npm run build
# Deploy 'dist' folder to your web server or use:
npm run start
```

## 5. Security Hardening
- **HTTPS:** Mandatory for payment terminal callbacks.
- **Firewall:** Restrict port 3000/443 to authorized IP ranges.
- **API Proxy:** Ensure the `process.env.API_KEY` is handled by the server-side only.