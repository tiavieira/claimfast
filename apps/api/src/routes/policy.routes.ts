import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const policyRouter = Router();

policyRouter.use(requireAuth);

policyRouter.get('/', (req: AuthRequest, res) => {
  const db = getDb();
  const rows = db.prepare(
    "SELECT * FROM policies WHERE user_id = ? AND status IN ('active') ORDER BY type"
  ).all(req.userId) as any[];
  res.json(rows.map(p => ({ ...p, coverages: JSON.parse(p.coverages ?? '[]') })));
});

policyRouter.get('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM policies WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
  if (!row) return res.status(404).json({ error: 'Apólice não encontrada' });
  res.json({ ...row, coverages: JSON.parse(row.coverages ?? '[]') });
});

const TYPE_COVERAGES: Record<string, any[]> = {
  auto: [
    { code: 'collision', label: 'Danos por colisão', limit: 0, deductible: 0 },
    { code: 'theft',     label: 'Furto e roubo',     limit: 0, deductible: 0 },
    { code: 'fire',      label: 'Incêndio',           limit: 0, deductible: 0 },
    { code: 'glass',     label: 'Quebra de vidros',   limit: 0, deductible: 0 },
    { code: 'liability', label: 'Responsabilidade civil', limit: 0, deductible: 0 },
  ],
  home: [
    { code: 'fire',      label: 'Incêndio e explosão',           limit: 0, deductible: 0 },
    { code: 'flood',     label: 'Inundação e danos por água',    limit: 0, deductible: 0 },
    { code: 'theft',     label: 'Furto e roubo de conteúdo',     limit: 0, deductible: 0 },
    { code: 'liability', label: 'Responsabilidade civil familiar', limit: 0, deductible: 0 },
  ],
  health: [
    { code: 'consultation', label: 'Consultas médicas',  limit: 0, deductible: 0 },
    { code: 'hospital',     label: 'Internamento',       limit: 0, deductible: 0 },
    { code: 'surgery',      label: 'Cirurgias',          limit: 0, deductible: 0 },
    { code: 'dental',       label: 'Medicina dentária',  limit: 0, deductible: 0 },
  ],
  life: [
    { code: 'death',      label: 'Capital em caso de morte',   limit: 0, deductible: 0 },
    { code: 'disability', label: 'Invalidez permanente',       limit: 0, deductible: 0 },
  ],
};

policyRouter.post('/', (req: AuthRequest, res) => {
  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });

  const {
    type, insurer, policy_number, start_date, end_date, premium_monthly,
    plate, vehicle_make, vehicle_model, vehicle_year, address,
  } = req.body;

  if (!type || !insurer || !policy_number || !start_date || !end_date) {
    return res.status(400).json({ error: 'Campos obrigatórios em falta' });
  }

  const existing = db.prepare('SELECT id FROM policies WHERE policy_number = ?').get(policy_number);
  if (existing) return res.status(409).json({ error: 'Número de apólice já registado' });

  const id = uuid();
  const coverages = JSON.stringify(TYPE_COVERAGES[type] ?? []);

  db.prepare(`
    INSERT INTO policies
      (id, user_id, type, insurer, policy_number, holder_name, start_date, end_date,
       premium_monthly, status, plate, vehicle_make, vehicle_model, vehicle_year,
       address, coverages, source, validation_status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, req.userId, type, insurer, policy_number, user.name,
    start_date, end_date, premium_monthly ?? null, 'active',
    plate ?? null, vehicle_make ?? null, vehicle_model ?? null, vehicle_year ?? null,
    address ?? null, coverages, 'manual', 'pending',
  );

  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(id) as any;
  res.status(201).json({ ...policy, coverages: JSON.parse(policy.coverages) });
});
