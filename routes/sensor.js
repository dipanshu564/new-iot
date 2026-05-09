const express = require('express');
const fs = require('fs');
const path = require('path');

module.exports = function (db, lcdFile) {
  const router = express.Router();

  router.post('/device/sensor', (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== 'SIStec-2026-ESP') {
      return res.status(401).json({ error: 'Unauthorized device' });
    }

    const { temperature, humidity } = req.body;
    if (!temperature || !humidity) {
      return res.status(400).json({ error: 'Temperature and humidity are required.' });
    }

    const now = new Date();
    const time = now.toLocaleTimeString();
    const date = now.toLocaleDateString();

    db.run('INSERT INTO sensor (temperature, humidity, time, date) VALUES (?, ?, ?, ?)', [temperature, humidity, time, date], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Could not save sensor record.' });
      }
      res.json({ success: true, id: this.lastID });
    });
  });

  router.use((req, res, next) => {
    if (req.session && req.session.user) {
      return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
  });

  router.post('/sensor', (req, res) => {
    const { temperature, humidity } = req.body;
    if (!temperature || !humidity) {
      return res.status(400).json({ error: 'Temperature and humidity are required.' });
    }

    const now = new Date();
    const time = now.toLocaleTimeString();
    const date = now.toLocaleDateString();

    db.run('INSERT INTO sensor (temperature, humidity, time, date) VALUES (?, ?, ?, ?)', [temperature, humidity, time, date], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Could not save sensor record.' });
      }
      res.json({ success: true, id: this.lastID });
    });
  });

  router.get('/latest', (req, res) => {
    db.get('SELECT * FROM sensor ORDER BY id DESC LIMIT 1', (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Could not read latest record.' });
      }
      res.json({ latest: row || null });
    });
  });

  router.get('/records', (req, res) => {
    db.all('SELECT * FROM sensor ORDER BY id DESC', (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Could not read records.' });
      }
      res.json({ records: rows });
    });
  });

  router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM sensor WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Could not delete record.' });
      }
      res.json({ success: true });
    });
  });

  router.get('/lcd', (req, res) => {
    fs.readFile(lcdFile, 'utf8', (err, data) => {
      if (err) {
        return res.status(500).json({ error: 'Could not read LCD message.' });
      }
      res.json({ message: data.trim() });
    });
  });

  router.post('/lcd', (req, res) => {
    const { message } = req.body;
    if (typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }
    const text = message.slice(0, 16);
    fs.writeFile(lcdFile, text, 'utf8', (err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not save LCD message.' });
      }
      res.json({ success: true, message: text });
    });
  });

  router.get('/stats', (req, res) => {
    db.all('SELECT temperature, humidity FROM sensor', (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Could not load stats.' });
      }
      const total = rows.length;
      let sumTemp = 0;
      let sumHum = 0;
      rows.forEach((row) => {
        sumTemp += parseFloat(row.temperature) || 0;
        sumHum += parseFloat(row.humidity) || 0;
      });
      const averageTemperature = total ? (sumTemp / total).toFixed(1) : 0;
      const averageHumidity = total ? (sumHum / total).toFixed(1) : 0;
      res.json({ total, averageTemperature, averageHumidity });
    });
  });

  return router;
};
