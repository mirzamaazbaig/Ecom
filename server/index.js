const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Allow both ports
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Test Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the E-Commerce API' });
});

// Database Connection Test
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL Database'))
    .catch(err => console.error('Database connection error:', err));


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
