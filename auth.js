const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');

const router = express.Router();

/**
 * POST /api/register
 * body:
 * {
 *   "email": "abc@gmail.com",
 *   "password": "123456"
 * }
 */
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: 'email và password là bắt buộc'
        });
    }

    try {
        const [exists] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (exists.length > 0) {
            return res.status(409).json({
                error: 'email đã tồn tại'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            'INSERT INTO users(email, password) VALUES (?, ?)',
            [email, hashedPassword]
        );

        res.status(201).json({
            id: result.insertId,
            email
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'lỗi máy chủ'
        });
    }
});


/**
 * POST /api/login
 * body:
 * {
 *   "email": "abc@gmail.com",
 *   "password": "123456"
 * }
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: 'email và password là bắt buộc'
        });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                error: 'sai email hoặc mật khẩu'
            });
        }

        const user = rows[0];

        const ok = await bcrypt.compare(
            password,
            user.password
        );

        if (!ok) {
            return res.status(401).json({
                error: 'sai email hoặc mật khẩu'
            });
        }

        res.json({
            ok: true,
            user: {
                id: user.id,
                email: user.email
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'lỗi máy chủ'
        });
    }
});

module.exports = router;
