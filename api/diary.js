import { reportServiceError } from '../database/error-monitor.mjs';
import { neon } from '@neondatabase/serverless';
import { getAuthenticatedUser } from '../database/social-auth-handler.mjs';

const send = (res, status, payload) => res.status(status).setHeader('Cache-Control', 'no-store').json(payload);
const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const mealTypes = new Set(['breakfast', 'lunch', 'afternoon', 'dinner', 'snack']);
const toNumeric = v => v == null ? null : typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100000 ? v : NaN;
const shown = row => ({
  id: row.id, name: row.food_name,
  date: typeof row.eaten_on === 'string' ? row.eaten_on.slice(0,10) : new Date(row.eaten_on).toISOString().slice(0,10),
  category: row.meal_category,
  calories: row.calories == null ? null : Number(row.calories),
  protein: row.protein == null ? null : Number(row.protein),
  carbs: row.carbs == null ? null : Number(row.carbs),
  fat: row.fat == null ? null : Number(row.fat),
  time: new Date(row.created_at).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit',timeZone:'Asia/Ho_Chi_Minh'}),
  thumb: null
});

export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (!process.env.DATABASE_URL) return send(res,503,{error:'Database not configured'});
  if (!['GET','POST','PATCH','DELETE'].includes(req.method)) {
    res.setHeader('Allow','GET, POST, PATCH, DELETE');
    return send(res,405,{error:'Method not allowed'});
  }
  const origin = req.headers.origin, host = req.headers['x-forwarded-host'] || req.headers.host;
  const isLocal = host && (host.startsWith('localhost') || host.startsWith('127.0.0.1'));
  if (origin && (!host || (!origin.startsWith('https://') && !isLocal) || new URL(origin).host !== host))
    return send(res,403,{error:'Origin not allowed'});
  const sql = neon(process.env.DATABASE_URL);
  try {
    const user = await getAuthenticatedUser(req, sql);
    if (!user) return send(res,401,{error:'Cần đăng nhập để sử dụng nhật ký'});
    if (req.method === 'GET') {
      const rows = await sql`SELECT id, eaten_on, food_name, meal_category, calories, protein, carbs, fat, created_at
        FROM user_diary_entries WHERE user_id = ${user.id}
        ORDER BY eaten_on DESC, created_at DESC LIMIT 1000`;
      return send(res,200,{meals:rows.map(shown)});
    }
    if (req.method === 'POST') {
      const b = req.body || {}, name = typeof b.name === 'string' ? b.name.trim() : '';
      const day = typeof b.date === 'string' ? b.date : '';
      const vals = ['calories','protein','carbs','fat'].map(k => toNumeric(b[k]));
      const dayIsValid = /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day));
      if (!name || name.length > 150 || !dayIsValid || !mealTypes.has(b.category) || vals.some(Number.isNaN))
        return send(res,400,{error:'Thông tin món ăn không hợp lệ'});
      const rows = await sql`INSERT INTO user_diary_entries
        (user_id, eaten_on, food_name, meal_category, calories, protein, carbs, fat)
        VALUES (${user.id},${day},${name},${b.category},${vals[0]},${vals[1]},${vals[2]},${vals[3]})
        RETURNING id, eaten_on, food_name, meal_category, calories, protein, carbs, fat, created_at`;
      return send(res,201,{meal:shown(rows[0])});
    }
    const id = req.method === 'DELETE' ? req.query?.id : req.body?.id;
    if (typeof id !== 'string' || !validId.test(id)) return send(res,400,{error:'ID món ăn không hợp lệ'});
    if (req.method === 'PATCH') {
      const category = req.body?.category;
      if (!mealTypes.has(category)) return send(res,400,{error:'Loại bữa ăn không hợp lệ'});
      const rows = await sql`UPDATE user_diary_entries SET meal_category = ${category}
        WHERE id = ${id} AND user_id = ${user.id} RETURNING id`;
      return send(res,rows.length?200:404,{ok:!!rows.length});
    }
    const rows = await sql`DELETE FROM user_diary_entries
      WHERE id = ${id} AND user_id = ${user.id} RETURNING id`;
    return send(res,rows.length?200:404,{ok:!!rows.length});
  } catch (_) {
    await reportServiceError('diary_unavailable');
    return send(res,503,{error:'Nhật ký tạm thời không kết nối được database'});
  }
}
