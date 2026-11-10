// POST /api/meals  {mon, calo, ngay_gio?}   -> lưu 1 bữa ăn
// GET  /api/meals?date=YYYY-MM-DD           -> các bữa trong ngày
// Mount: app.use('/api', require('./meals')());
const express = require('express');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;
const pad = n => String(n).padStart(2, '0');

function isRealDate(s) {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function nowLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// 'YYYY-MM-DD[T ]HH:mm[:ss]' (giờ địa phương của người dùng) -> 'YYYY-MM-DD HH:mm:ss' hoặc null nếu sai
function parseDateTime(s) {
  const m = typeof s === 'string' && DATETIME_RE.exec(s.trim());
  if (!m) return null;
  const [, date, hh, mm, ss = '00'] = m;
  if (!isRealDate(date) || +hh > 23 || +mm > 59 || +ss > 59) return null;
  return `${date} ${hh}:${mm}:${ss}`;
}

module.exports = function createMealsRouter(pool = require('./db')) {
  const router = express.Router();

  router.post('/meals', async (req, res) => {
    const { mon, calo, ngay_gio } = req.body || {};
    const name = typeof mon === 'string' ? mon.trim() : '';
    if (!name || name.length > 100) return res.status(400).json({ error: 'mon phải là chuỗi 1-100 ký tự' });
    if (typeof calo !== 'number' || !Number.isFinite(calo) || calo < 0 || calo > 20000)
      return res.status(400).json({ error: 'calo phải là số từ 0 đến 20000' });
    let anLuc;
    if (ngay_gio === undefined || ngay_gio === null || ngay_gio === '') anLuc = nowLocal();
    else if (!(anLuc = parseDateTime(ngay_gio)))
      return res.status(400).json({ error: 'ngay_gio phải dạng YYYY-MM-DDTHH:mm[:ss]' });

    const kcal = Math.round(calo);
    try {
      const [r] = await pool.execute('INSERT INTO meals (mon, calo, an_luc) VALUES (?, ?, ?)', [name, kcal, anLuc]);
      res.status(201).json({ id: r.insertId, mon: name, calo: kcal, ngay_gio: anLuc.replace(' ', 'T') });
    } catch (e) {
      console.error('POST /meals', e);
      res.status(500).json({ error: 'lỗi cơ sở dữ liệu' });
    }
  });

  router.get('/meals', async (req, res) => {
    const date = req.query.date;
    if (typeof date !== 'string' || !isRealDate(date))
      return res.status(400).json({ error: 'date phải dạng YYYY-MM-DD' });
    try {
      const [rows] = await pool.execute(
        `SELECT id, mon, calo, an_luc FROM meals
         WHERE an_luc >= ? AND an_luc < DATE_ADD(?, INTERVAL 1 DAY)
         ORDER BY an_luc, id`,
        [date, date]
      );
      const bua_an = rows.map(r => ({ id: r.id, mon: r.mon, calo: r.calo, ngay_gio: String(r.an_luc).replace(' ', 'T') }));
      res.json({ date, tong_calo: bua_an.reduce((s, m) => s + m.calo, 0), bua_an });
    } catch (e) {
      console.error('GET /meals', e);
      res.status(500).json({ error: 'lỗi cơ sở dữ liệu' });
    }
  });

  return router;
};
