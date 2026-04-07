import { Router } from 'express';
import { getDb } from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const notificationRouter = Router();
notificationRouter.use(requireAuth);

notificationRouter.get('/', (req: AuthRequest, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 30').all(req.userId);
  res.json(rows);
});

notificationRouter.put('/read-all', (req: AuthRequest, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read=1 WHERE user_id=?').run(req.userId);
  res.json({ ok: true });
});

notificationRouter.put('/:id/read', (req: AuthRequest, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read=1 WHERE id=? AND user_id=?').run(req.params.id, req.userId);
  res.json({ ok: true });
});
