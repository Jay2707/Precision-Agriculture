// Backend server for Precision Agriculture — Crop Disease Detection
// Group 235 | VIT Bhopal | B.Tech AI-ML

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const app = express();
const SALT_ROUNDS = 10;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// MySQL connection — credentials come from environment variables (see .env.example)
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'crop_disease_db',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    return;
  }
  console.log('Connected to MySQL database');
});

// Nodemailer configuration — credentials come from environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Health check
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Sign Up — password is hashed with bcrypt before storage
app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'username, email and password are required' });
  }

  const checkQuery = 'SELECT id FROM users WHERE email = ?';
  db.query(checkQuery, [email], async (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (result.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    try {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const insertQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      db.query(insertQuery, [username, email, passwordHash], (err, result) => {
        if (err) return res.status(500).json({ message: 'Sign up failed' });

        const user = { id: result.insertId, username, email };

        if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to Precision Agriculture — Crop Disease Detector',
            text: `Hi ${username},\n\nThank you for signing up! Upload a leaf photo any time to get an instant disease diagnosis.\n\n- Group 235, VIT Bhopal`,
          };
          transporter.sendMail(mailOptions, (error) => {
            if (error) console.error('Error sending welcome email:', error.message);
          });
        }

        res.json({ message: 'User signed up successfully', user });
      });
    } catch (hashErr) {
      res.status(500).json({ message: 'Failed to secure password' });
    }
  });
});

// Sign In — compares the submitted password against the bcrypt hash
app.post('/signin', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (result.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Sign in successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        photoURL: `https://i.pravatar.cc/40?u=${user.email}`,
      },
    });
  });
});

// Create a new community post
app.post('/posts', (req, res) => {
  const { user_id, caption, image } = req.body;

  const query = 'INSERT INTO posts (user_id, caption, image) VALUES (?, ?, ?)';
  db.query(query, [user_id, caption, image], (err, result) => {
    if (err) {
      console.error('Error creating post:', err.message);
      return res.status(500).json({ message: 'Failed to create post' });
    }
    res.json({ message: 'Post created successfully', postId: result.insertId });
  });
});

// Get all posts with user info and comments
app.get('/posts', (req, res) => {
  const postsQuery = `
    SELECT p.id AS post_id, p.caption, p.image, p.created_at, u.username
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `;

  db.query(postsQuery, (err, posts) => {
    if (err) {
      console.error('Error fetching posts:', err.message);
      return res.status(500).json({ message: 'Failed to fetch posts' });
    }

    const postIds = posts.map((post) => post.post_id);
    if (postIds.length === 0) return res.json({ posts: [] });

    const commentsQuery = `
      SELECT c.post_id, c.comment, c.created_at, u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id IN (?)
      ORDER BY c.created_at ASC
    `;

    db.query(commentsQuery, [postIds], (err, comments) => {
      if (err) {
        console.error('Error fetching comments:', err.message);
        return res.status(500).json({ message: 'Failed to fetch comments' });
      }

      const postsWithComments = posts.map((post) => ({
        ...post,
        comments: comments.filter((c) => c.post_id === post.post_id),
      }));

      res.json({ posts: postsWithComments });
    });
  });
});

// Add a comment
app.post('/comments', (req, res) => {
  const { post_id, user_id, comment } = req.body;

  const query = 'INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)';
  db.query(query, [post_id, user_id, comment], (err) => {
    if (err) {
      console.error('Error adding comment:', err.message);
      return res.status(500).json({ message: 'Failed to add comment' });
    }
    res.json({ message: 'Comment added successfully' });
  });
});

// AI helper — used by Voice Assistant and Control Methods
app.post('/api/ai', async (req, res) => {
  const { system, prompt, maxTokens } = req.body;
  if (!prompt) return res.status(400).json({ message: 'prompt is required' });
  if (!process.env.AI_API_KEY) return res.status(500).json({ message: 'AI_API_KEY missing in .env' });

  try {
    const r = await fetch(process.env.AI_API_URL || 'https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: system || 'You are a helpful agricultural expert assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1500,
        reasoning_effort: 'low',
        temperature: 0.7,
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ message: data?.error?.message || 'AI provider error' });
    res.json({ text: data?.choices?.[0]?.message?.content || '' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
