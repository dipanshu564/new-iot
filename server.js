const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const dbFile = path.join(__dirname, 'database.db');
const lcdFile = path.join(__dirname, 'lcd.txt');

if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, '');
}

if (!fs.existsSync(lcdFile)) {
  fs.writeFileSync(lcdFile, 'Welcome to SIStec IoT');
}

const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sensor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temperature TEXT,
    humidity TEXT,
    time TEXT,
    date TEXT
  )`);
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: 'sistec-secret-2026',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.static(path.join(__dirname, 'public')));

const authRoutes = require('./routes/auth')(db);
const sensorRoutes = require('./routes/sensor')(db, lcdFile);

app.use('/auth', authRoutes);
app.use('/api', sensorRoutes);

app.get('/dashboard', (req, res) => {
  if (req.session && req.session.user) {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  } else {
    res.redirect('/');
  }
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
