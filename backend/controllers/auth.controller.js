const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    // 1. Accept username from the frontend
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 2. Save username to the database (role defaults to 'client' automatically)
    await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
      [username, email, hashedPassword]
    );
    
    res.status(201).json({ message: 'Identity registered successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists in the network.' });
    res.status(500).json({ message: 'Registration sequence failed.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [[user]] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // 3. Send the role and username back to the frontend
    res.json({ token, email: user.email, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Login sequence failed.' });
  }
};

module.exports = { register, login };