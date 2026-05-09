# SIStec IoT Application 2026

Beginner full-stack IoT web application using Node.js, Express, SQLite, and Tailwind CSS.

## Features

- Session-based login and registration
- Protected dashboard route
- Live temperature and humidity cards
- Automatic refresh every 5 seconds
- LCD message sender saved to `lcd.txt`
- Sensor records table with search, pagination, delete, and CSV export
- Fake sensor record generator
- Simple Chart.js line graph for temperature and humidity
- Dark mode toggle

## Run locally

1. Open the project folder in your terminal
2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm start
```

4. Open the app at `http://localhost:3000`

## Deploy to Render

- Render will use `npm install` and `npm start` automatically.
- The app listens on `process.env.PORT` or `3000`.

## ESP8266 Integration

A simple ESP8266 sketch is included to post temperature and humidity values to the app.

- Endpoint: `http://<host>:3000/api/device/sensor`
- Header: `x-api-key: SIStec-2026-ESP`
- JSON body: `{ "temperature": 24.6, "humidity": 55.2 }`

## Project files

- `server.js` - Express server and routing
- `routes/auth.js` - Authentication endpoints
- `routes/sensor.js` - Sensor and LCD APIs
- `public/` - Frontend pages and scripts
- `database.db` - SQLite database file
- `lcd.txt` - Stored LCD message
