const express = require('express');

module.exports = function (db) {
  const router = express.Router();

  router.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }
      if (row) {
        return res.status(409).json({ error: 'Email already registered.' });
      }

      db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password], function (insertErr) {
        if (insertErr) {
          return res.status(500).json({ error: 'Could not create user.' });
        }
        res.json({ success: true });
      });
    });
  });

  router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    db.get('SELECT id, name, email, password FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email
      };
      res.json({ success: true });
    });
  });

  router.get('/user', (req, res) => {
    if (req.session && req.session.user) {
      return res.json({ user: req.session.user });
    }
    res.status(401).json({ error: 'Unauthorized' });
  });

  return router;
};
