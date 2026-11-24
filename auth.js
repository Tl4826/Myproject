const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handleRegister(email, password, name, res) {
    if (!email || !password) {
        return res.status(400).json({ error: 'email và password là bắt buộc' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 254) {
        return res.status(400).json({ error: 'email không hợp lệ' });
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
        return res.status(400).json({ error: 'mật khẩu phải có từ 6 đến 128 ký tự' });
    }

    try {
        const [exists] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [cleanEmail]
        );

        if (exists.length > 0) {
            return res.status(409).json({ error: 'email đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            'INSERT INTO users(email, password) VALUES (?, ?)',
            [cleanEmail, hashedPassword]
        );

        res.status(201).json({
            id: result.insertId,
            email: cleanEmail,
            name: name || ''
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'lỗi máy chủ' });
    }
}

async function handleLogin(email, password, res) {
    if (!email || !password) {
        return res.status(400).json({ error: 'email và password là bắt buộc' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (typeof password !== 'string' || password.length < 6) {
        return res.status(401).json({ error: 'sai email hoặc mật khẩu' });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [cleanEmail]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'sai email hoặc mật khẩu' });
        }

        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password);

        if (!ok) {
            return res.status(401).json({ error: 'sai email hoặc mật khẩu' });
        }

        res.json({
            ok: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name || user.email.split('@')[0]
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'lỗi máy chủ' });
    }
}

/**
 * POST /api/register
 */
router.post('/register', async (req, res) => {
    const { email, password, name } = req.body || {};
    return handleRegister(email, password, name, res);
});

/**
 * POST /api/login
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    return handleLogin(email, password, res);
});

/**
 * POST /api/email-auth
 * Tương thích với payload từ frontend AppContext.jsx
 */
router.post('/email-auth', async (req, res) => {
    const { action, email, password, name } = req.body || {};
    if (action === 'register') {
        return handleRegister(email, password, name, res);
    }
    if (action === 'login') {
        return handleLogin(email, password, res);
    }
    return res.status(400).json({ error: 'action không hợp lệ' });
});

module.exports = router;
