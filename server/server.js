require('dotenv').config(); // Add this line for environment variables
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection using environment variables
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blog'
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1); // Exit if database connection fails
    }
    console.log('MySQL Connected...');
});

// Middleware for verifying token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied, token missing!' });

    jwt.verify(token, process.env.JWT_SECRET_KEY || 'your_secret_key', (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

// Register a new user
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword],
            (err, result) => {
                if (err) {
                    console.error('Registration error:', err);
                    return res.status(500).json({ message: 'Registration failed!' });
                }
                res.status(201).json({ message: 'User registered successfully' });
            }
        );
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login user
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, result) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ message: 'Login failed!' });
        }
        if (result.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = result[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(403).json({ message: 'Incorrect email or password' });

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET_KEY || 'your_secret_key', { expiresIn: '1h' });
        res.status(200).json({ token });
    });
});

// Get all posts
app.get('/posts', (req, res) => {
    db.query('SELECT * FROM posts', (err, result) => {
        if (err) {
            console.error('Error fetching posts:', err);
            return res.status(500).json({ message: 'Error fetching posts' });
        }
        res.status(200).json(result);
    });
});

// Route to create a new post
app.post('/api/posts', verifyToken, (req, res) => {
    const { title, content } = req.body;

    db.query('INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)', [title, content, req.user.id], (err, result) => {
        if (err) {
            console.error('Error creating post:', err);
            return res.status(500).json({ message: 'Error creating post', error: err });
        }
        res.status(201).json({ id: result.insertId, title, content });
    });
});

// Delete a post by ID
app.delete('/api/posts/:id', verifyToken, (req, res) => {
    const postId = req.params.id;

    // Check if the post exists before deleting
    db.query('DELETE FROM posts WHERE id = ?', [postId], (err, result) => {
        if (err) {
            console.error('Error deleting post:', err);
            return res.status(500).json({ message: 'Error deleting post' });
        }
        
        // Check if any rows were affected (meaning the post was found and deleted)
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        res.status(200).json({ message: 'Post deleted successfully' });
    });
});

// Update post by title
app.put('/api/posts', (req, res) => {
    const { oldTitle, newTitle, newContent } = req.body;

    const sql = 'UPDATE posts SET title = ?, content = ? WHERE title = ?';
    db.query(sql, [newTitle, newContent, oldTitle], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to update post.' });
        }
        res.json({ message: 'Post updated successfully!' });
    });
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Listen on port 3001
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
