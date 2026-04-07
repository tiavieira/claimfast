import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';

// Insurer portal — no per-user auth, uses a shared demo token
export const insurerRouter = Router();

const REPAIR_SHOPS = [
  { id: '1', name: 'Oficina Central Auto', address: 'Av. da República 45, Lisboa', distance: 0.8, rating: 4.8, reviews: 312, specialties: ['Colisão', 'Pintura', 'Mecânica'], availability: 'Hoje', phone: '+351 213 456 789', authorized: true, waitDays: 0 },
  { id: '2', name: 'Auto Reparações Norte', address: 'Rua de Campolide 12, Lisboa', distance: 1.4, rating: 4.6, reviews: 198, specialties: ['Colisão', 'Vidros', 'Elétrica'], availability: 'Amanhã', phone: '+351 217 890 123', authorized: true, waitDays: 1 },
  { id: '3', name: 'Técnica Auto Sintra', address: 'Estrada de Sintra 88, Queluz', distance: 3.2, rating: 4.5, reviews: 145, specialties: ['Mecânica', 'Pintura'], availability: 'Esta semana', phone: '+351 219 234 567', authorized: true, waitDays: 3 },
  { id: '4', name: 'Serviço Rápido Cascais', address: 'Av. Marginal 200, Cascais', distance: 5.7, rating: 4.3, reviews: 89, specialties: ['Colisão', 'Mecânica'], availability: 'Esta semana', phone: '+351 214 567 890', authorized: false, waitDays: 4 },
  { id: '5', name: 'Euro Auto Service', address: 'Rua Almirante Reis 330, Lisboa', distance: 2.1, rating: 4.7, reviews: 267, specialties: ['Colisão', 'Pintura', 'Vidros', 'Elétrica'], availability: 'Amanhã', phone: '+351 218 901 234', authorized: true, waitDays: 1 },
];

const INSURER_TOKEN = 'insurer-demo-2024';

function checkToken(req: Request, res: Response): boolean {
  const auth = req.headers.authorization ?? '';
  if (!auth.includes(INSURER_TOKEN)) {
    res.status(401).json({ error: 'Acesso não autorizado' });
    return false;
  }
  return true;
}

/* ── KPI summary ── */
insurerRouter.get('/stats', (req, res) => {
  if (!checkToken(req, res)) return;
  const db = getDb();

  const total       = (db.prepare('SELECT COUNT(*) as n FROM claims').get() as any).n;
  const thisMonth   = (db.prepare("SELECT COUNT(*) as n FROM claims WHERE created_at >= date('now','start of month')").get() as any).n;
  const pending     = (db.prepare("SELECT COUNT(*) as n FROM claims WHERE status NOT IN ('paid','rejected')").get() as any).n;
  const paid        = (db.prepare("SELECT COUNT(*) as n FROM claims WHERE status = 'paid'").get() as any).n;
  const fraudAlerts = (db.prepare('SELECT COUNT(*) as n FROM claims WHERE fraud_score >= 45').get() as any).n;
  const avgScore    = (db.prepare("SELECT AVG(CAST(REPLACE(json_extract(ai_analysis,'$.estimatedAmount'),'null','0') AS REAL)) as v FROM claims WHERE status = 'paid'").get() as any).v ?? 0;
  const totalPaid   = (db.prepare("SELECT SUM(approved_amount) as v FROM claims WHERE status = 'paid'").get() as any).v ?? 0;

  // Avg resolution time in days (submitted → paid/approved)
  const resolutionRows = db.prepare(`
    SELECT c.created_at, e.created_at as resolved_at
    FROM claims c
    JOIN claim_events e ON e.claim_id = c.id AND e.status IN ('approved','paid')
    WHERE c.status IN ('approved','paid')
  `).all() as any[];

  let avgResolutionDays = 0;
  if (resolutionRows.length > 0) {
    const total = resolutionRows.reduce((sum, r) => {
      return sum + Math.abs((new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / 86_400_000);
    }, 0);
    avgResolutionDays = Math.round((total / resolutionRows.length) * 10) / 10;
  }

  // Cost savings estimate: assume manual processing = €85/claim, ClaimFast = €12/claim
  const savingsPerClaim = 73;
  const estimatedSavings = total * savingsPerClaim;

  const resolved = (db.prepare("SELECT COUNT(*) as n FROM claims WHERE status IN ('approved','paid','rejected')").get() as any).n;
  const approvedOrPaid = (db.prepare("SELECT COUNT(*) as n FROM claims WHERE status IN ('approved','paid')").get() as any).n;
  const approvalRate = resolved > 0 ? Math.round((approvedOrPaid / resolved) * 100) : 0;

  const avgClaimAmount = (db.prepare("SELECT AVG(estimated_amount) as v FROM claims WHERE estimated_amount IS NOT NULL AND estimated_amount > 0").get() as any).v ?? 0;

  res.json({
    total, thisMonth, pending, paid, fraudAlerts,
    avgResolutionDays: avgResolutionDays || 4.2,
    totalPaidAmount: totalPaid,
    estimatedSavings,
    automationRate: 94, // % of claims auto-processed
    approvalRate,
    avgClaimAmount: Math.round(avgClaimAmount),
  });
});

/* ── Claims list with fraud scores ── */
insurerRouter.get('/claims', (req, res) => {
  if (!checkToken(req, res)) return;
  const db = getDb();

  const { status, minFraud, type, search } = req.query;
  let query = `
    SELECT c.*, u.name as user_name, u.email as user_email,
           p.type as policy_type, p.insurer, p.policy_number
    FROM claims c
    JOIN users u ON c.user_id = u.id
    JOIN policies p ON c.policy_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status)   { query += ' AND c.status = ?';       params.push(status); }
  if (minFraud) { query += ' AND c.fraud_score >= ?';  params.push(Number(minFraud)); }
  if (type)     { query += ' AND c.type = ?';          params.push(type); }
  if (search)   { query += ' AND (c.title LIKE ? OR u.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  query += ' ORDER BY c.created_at DESC LIMIT 100';

  const rows = db.prepare(query).all(...params) as any[];
  const claims = rows.map(r => ({
    ...r,
    ai_analysis:  r.ai_analysis  ? JSON.parse(r.ai_analysis)  : null,
    fraud_factors: r.fraud_factors ? JSON.parse(r.fraud_factors) : [],
    photos: JSON.parse(r.photos ?? '[]'),
  }));
  res.json(claims);
});

/* ── Chart data ── */
insurerRouter.get('/charts', (req, res) => {
  if (!checkToken(req, res)) return;
  const db = getDb();

  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM claims GROUP BY status').all();
  const byType   = db.prepare('SELECT type, COUNT(*) as count, AVG(estimated_amount) as avg_amount FROM claims GROUP BY type').all();

  // Fraud distribution buckets
  const fraudDist = [
    { label: 'Baixo (0–24)',    range: [0, 24],   count: 0, color: '#10B981' },
    { label: 'Médio (25–44)',   range: [25, 44],  count: 0, color: '#F59E0B' },
    { label: 'Alto (45–69)',    range: [45, 69],  count: 0, color: '#F97316' },
    { label: 'Crítico (70+)',   range: [70, 100], count: 0, color: '#EF4444' },
  ];
  const allScores = db.prepare('SELECT fraud_score FROM claims WHERE fraud_score IS NOT NULL').all() as any[];
  allScores.forEach(({ fraud_score }) => {
    const bucket = fraudDist.find(b => fraud_score >= b.range[0] && fraud_score <= b.range[1]);
    if (bucket) bucket.count++;
  });

  // Monthly volume (last 6 months)
  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count,
           SUM(CASE WHEN status='paid' THEN approved_amount ELSE 0 END) as paid_amount
    FROM claims
    GROUP BY month ORDER BY month DESC LIMIT 6
  `).all() as any[];

  res.json({
    byStatus,
    byType,
    fraudDistribution: fraudDist,
    monthly: monthly.reverse(),
  });
});

/* ── Repair shop network ── */
insurerRouter.get('/repair-shops', (req, res) => {
  res.json(REPAIR_SHOPS);
});

/* ── Pre-authorize repair at shop ── */
insurerRouter.post('/repair-shops/:shopId/authorize', (req, res) => {
  const shop = REPAIR_SHOPS.find(s => s.id === req.params.shopId);
  if (!shop) return res.status(404).json({ error: 'Oficina não encontrada' });
  const { claimId, estimatedAmount } = req.body;
  res.json({
    authorizationCode: `CF-AUTH-${Date.now().toString(36).toUpperCase()}`,
    shop,
    claimId,
    estimatedAmount,
    validUntil: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    message: `Reparação pré-autorizada na ${shop.name}. Código válido por 7 dias.`,
  });
});
