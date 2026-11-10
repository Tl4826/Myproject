require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // giao diện chạy khác origin (file:// hoặc Live Server) nên cần CORS
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', require('./analyze'));
app.use('/api', require('./auth'));
app.use('/api', require('./meals')());

// lỗi upload (ảnh quá 8MB...) và JSON sai
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'ảnh quá lớn (tối đa 8MB)' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON không hợp lệ' });
  console.error(err);
  res.status(500).json({ error: 'lỗi máy chủ' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API chạy ở http://localhost:${port}`));
}
module.exports = app;
