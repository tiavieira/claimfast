import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/connection';
import { signToken, requireAuth, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e password obrigatórios' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = signToken(user.id);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
  });
});

authRouter.get('/me', requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id,email,name,phone,nif,iban FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
  res.json(user);
});

authRouter.put('/profile', requireAuth, (req: AuthRequest, res) => {
  const { name, phone, nif, iban } = req.body;
  const db = getDb();
  const fields: string[] = [];
  const vals: any[] = [];
  if (name  !== undefined) { fields.push('name=?');  vals.push(name); }
  if (phone !== undefined) { fields.push('phone=?'); vals.push(phone); }
  if (nif   !== undefined) { fields.push('nif=?');   vals.push(nif); }
  if (iban  !== undefined) { fields.push('iban=?');  vals.push(iban); }
  if (fields.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });
  vals.push(req.userId);
  db.prepare(`UPDATE users SET ${fields.join(',')} WHERE id=?`).run(...vals);
  const user = db.prepare('SELECT id,email,name,phone,nif,iban FROM users WHERE id=?').get(req.userId) as any;
  res.json(user);
});
