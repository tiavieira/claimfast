import { Router } from 'express';
import { getDb } from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const policyRouter = Router();

policyRouter.use(requireAuth);

policyRouter.get('/', (req: AuthRequest, res) => {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM policies WHERE user_id = ? AND status = 'active' ORDER BY type").all(req.userId) as any[];
  const policies = rows.map(p => ({
    ...p,
    coverages: JSON.parse(p.coverages ?? '[]'),
  }));
  res.json(policies);
});

policyRouter.get('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM policies WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
  if (!row) return res.status(404).json({ error: 'Apólice não encontrada' });
  res.json({ ...row, coverages: JSON.parse(row.coverages ?? '[]') });
});
