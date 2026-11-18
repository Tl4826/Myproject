// POST /api/analyze  (multipart field "file") -> model service /predict -> nutrition lookup
// Mount: app.use('/api', require('./analyze'));   Needs Node 18+, `npm i express multer`
const express = require('express');
const multer = require('multer');
const NUTRITION = require('./nutrition.json'); // { phobo: {ten, calo, dam, ...}, ... } filled from the 12-dish table
const MODEL_URL = process.env.MODEL_URL || 'http://localhost:8000';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const router = express.Router();
router.post('/analyze', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'missing file' });
  const form = new FormData();
  form.append('file', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);
  let r;
  try { r = await fetch(`${MODEL_URL}/predict`, { method: 'POST', body: form }); }
  catch { return res.status(502).json({ error: 'model service unreachable' }); }
  if (!r.ok) return res.status(r.status === 400 ? 400 : 502).json({ error: 'model service error' });
  const { mon, do_tin_cay, chac_chan, top3 } = await r.json();
  // chac_chan=false -> model is unsure, so do not show nutrition for a guess
  res.json({ mon, do_tin_cay, chac_chan, top3, nutrition: chac_chan ? NUTRITION[mon] ?? null : null });
});
module.exports = router;
