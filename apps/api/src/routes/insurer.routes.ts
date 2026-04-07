import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection';

export const insurerRouter = Router();

const REPAIR_SHOPS = [
  { id: '1', name: 'Oficina Central Auto',    address: 'Av. da República 45, Lisboa',      distance: 0.8, rating: 4.8, reviews: 312, specialties: ['Colisão', 'Pintura', 'Mecânica'],          availability: 'Hoje',       phone: '+351 213 456 789', authorized: true,  waitDays: 0 },
  { id: '2', name: 'Auto Reparações Norte',   address: 'Rua de Campolide 12, Lisboa',       distance: 1.4, rating: 4.6, reviews: 198, specialties: ['Colisão', 'Vidros', 'Elétrica'],           availability: 'Amanhã',     phone: '+351 217 890 123', authorized: true,  waitDays: 1 },
  { id: '3', name: 'Técnica Auto Sintra',     address: 'Estrada de Sintra 88, Queluz',      distance: 3.2, rating: 4.5, reviews: 145, specialties: ['Mecânica', 'Pintura'],                     availability: 'Esta semana', phone: '+351 219 234 567', authorized: true,  waitDays: 3 },
  { id: '4', name: 'Serviço Rápido Cascais',  address: 'Av. Marginal 200, Cascais',         distance: 5.7, rating: 4.3, reviews: 89,  specialties: ['Colisão', 'Mecânica'],                     availability: 'Esta semana', phone: '+351 214 567 890', authorized: false, waitDays: 4 },
  { id: '5', name: 'Euro Auto Service',       address: 'Rua Almirante Reis 330, Lisboa',    distance: 2.1, rating: 4.7, reviews: 267, specialties: ['Colisão', 'Pintura', 'Vidros', 'Elétrica'], availability: 'Amanhã',     phone: '+351 218 901 234', authorized: true,  waitDays: 1 },
];

// Map demo tokens → insurer name (extend here for more insurers)
const TOKEN_TO_INSURER: Record<string, string> = {
  'insurer-demo-2024': 'Fidelidade',
};

function getInsurer(req: Request, res: Response): string | null {
  const auth  = req.headers.authorization ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const name  = TOKEN_TO_INSURER[token];
  if (!name) { res.status(401).json({ error: 'Acesso não autorizado' }); return null; }
  return name;
}

/* ── KPI summary ── */
insurerRouter.get('/stats', (req, res) => {
  const insurer = getInsurer(req, res);
  if (!insurer) return;
  const db = getDb();

  const base = `FROM claims c JOIN policies p ON c.policy_id = p.id WHERE p.insurer = ?`;

  const total       = (db.prepare(`SELECT COUNT(*) as n ${base}`).get(insurer) as any).n;
  const thisMonth   = (db.prepare(`SELECT COUNT(*) as n ${base} AND c.created_at >= date('now','start of month')`).get(insurer) as any).n;
  const pending     = (db.prepare(`SELECT COUNT(*) as n ${base} AND c.status NOT IN ('paid','rejected')`).get(insurer) as any).n;
  const paid        = (db.prepare(`SELECT COUNT(*) as n ${base} AND c.status = 'paid'`).get(insurer) as any).n;
  const fraudAlerts = (db.prepare(`SELECT COUNT(*) as n ${base} AND c.fraud_score >= 45`).get(insurer) as any).n;
  const totalPaid   = (db.prepare(`SELECT SUM(c.approved_amount) as v ${base} AND c.status = 'paid'`).get(insurer) as any).v ?? 0;

  const resolutionRows = db.prepare(`
    SELECT c.created_at, e.created_at as resolved_at
    FROM claims c
    JOIN policies p ON c.policy_id = p.id
    JOIN claim_events e ON e.claim_id = c.id AND e.status IN ('approved','paid')
    WHERE p.insurer = ? AND c.status IN ('approved','paid')
  `).all(insurer) as any[];

  let avgResolutionDays = 0;
  if (resolutionRows.length > 0) {
    const sum = resolutionRows.reduce((acc, r) =>
      acc + Math.abs((new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / 86_400_000), 0);
    avgResolutionDays = Math.round((sum / resolutionRows.length) * 10) / 10;
  }

  const resolved      = (db.prepare(`SELECT COUNT(*) as n ${base} AND c.status IN ('approved','paid','rejected')`).get(insurer) as any).n;
  const approvedOrPaid = (db.prepare(`SELECT COUNT(*) as n ${base} AND c.status IN ('approved','paid')`).get(insurer) as any).n;
  const approvalRate  = resolved > 0 ? Math.round((approvedOrPaid / resolved) * 100) : 0;
  const avgClaimAmount = (db.prepare(`SELECT AVG(c.estimated_amount) as v ${base} AND c.estimated_amount > 0`).get(insurer) as any).v ?? 0;

  res.json({
    insurer,
    total, thisMonth, pending, paid, fraudAlerts,
    avgResolutionDays: avgResolutionDays || 4.2,
    totalPaidAmount: totalPaid,
    estimatedSavings: total * 73,
    automationRate: 94,
    approvalRate,
    avgClaimAmount: Math.round(avgClaimAmount),
  });
});

/* ── Claims list ── */
insurerRouter.get('/claims', (req, res) => {
  const insurer = getInsurer(req, res);
  if (!insurer) return;
  const db = getDb();

  const { status, minFraud, type, search } = req.query;
  let query = `
    SELECT c.*, u.name as user_name, u.email as user_email,
           p.type as policy_type, p.insurer, p.policy_number
    FROM claims c
    JOIN users u ON c.user_id = u.id
    JOIN policies p ON c.policy_id = p.id
    WHERE p.insurer = ?
  `;
  const params: any[] = [insurer];

  if (status)   { query += ' AND c.status = ?';                                         params.push(status); }
  if (minFraud) { query += ' AND c.fraud_score >= ?';                                   params.push(Number(minFraud)); }
  if (type)     { query += ' AND c.type = ?';                                           params.push(type); }
  if (search)   { query += ' AND (c.title LIKE ? OR u.name LIKE ?)';                    params.push(`%${search}%`, `%${search}%`); }

  query += ' ORDER BY c.created_at DESC LIMIT 100';

  const rows = db.prepare(query).all(...params) as any[];
  res.json(rows.map(r => ({
    ...r,
    ai_analysis:   r.ai_analysis   ? JSON.parse(r.ai_analysis)   : null,
    fraud_factors: r.fraud_factors ? JSON.parse(r.fraud_factors) : [],
    photos:        JSON.parse(r.photos ?? '[]'),
    days_pending: Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86_400_000),
    internal_notes: r.internal_notes ? JSON.parse(r.internal_notes) : [],
  })));
});

/* ── Chart data ── */
insurerRouter.get('/charts', (req, res) => {
  const insurer = getInsurer(req, res);
  if (!insurer) return;
  const db = getDb();

  const base = `FROM claims c JOIN policies p ON c.policy_id = p.id WHERE p.insurer = ?`;

  const byStatus = db.prepare(`SELECT c.status as status, COUNT(*) as count ${base} GROUP BY c.status`).all(insurer);
  const byType   = db.prepare(`SELECT c.type as type, COUNT(*) as count, AVG(c.estimated_amount) as avg_amount ${base} GROUP BY c.type`).all(insurer);

  const fraudDist = [
    { label: 'Baixo (0–24)',  range: [0,  24],  count: 0, color: '#10B981' },
    { label: 'Médio (25–44)', range: [25, 44],  count: 0, color: '#F59E0B' },
    { label: 'Alto (45–69)',  range: [45, 69],  count: 0, color: '#F97316' },
    { label: 'Crítico (70+)', range: [70, 100], count: 0, color: '#EF4444' },
  ];
  const allScores = db.prepare(`SELECT c.fraud_score ${base} AND c.fraud_score IS NOT NULL`).all(insurer) as any[];
  allScores.forEach(({ fraud_score }) => {
    const b = fraudDist.find(b => fraud_score >= b.range[0] && fraud_score <= b.range[1]);
    if (b) b.count++;
  });

  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', c.created_at) as month, COUNT(*) as count,
           SUM(CASE WHEN c.status='paid' THEN c.approved_amount ELSE 0 END) as paid_amount
    ${base}
    GROUP BY month ORDER BY month DESC LIMIT 6
  `).all(insurer) as any[];

  res.json({ byStatus, byType, fraudDistribution: fraudDist, monthly: monthly.reverse() });
});

/* ── Pending manual policies ── */
insurerRouter.get('/policies/pending', (req, res) => {
  const insurer = getInsurer(req, res);
  if (!insurer) return;
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.*, u.name as user_name, u.email as user_email, u.phone as user_phone
    FROM policies p JOIN users u ON p.user_id = u.id
    WHERE p.source = 'manual' AND p.validation_status = 'pending' AND p.insurer = ?
    ORDER BY p.created_at DESC
  `).all(insurer) as any[];
  res.json(rows.map(p => ({ ...p, coverages: JSON.parse(p.coverages ?? '[]') })));
});

insurerRouter.put('/policies/:id/validate', (req, res) => {
  const insurer = getInsurer(req, res);
  if (!insurer) return;
  const db  = getDb();
  const { action } = req.body;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Ação inválida' });

  const policy = db.prepare('SELECT * FROM policies WHERE id = ? AND insurer = ?').get(req.params.id, insurer) as any;
  if (!policy) return res.status(404).json({ error: 'Apólice não encontrada' });

  if (action === 'approve') {
    db.prepare("UPDATE policies SET validation_status = 'validated' WHERE id = ?").run(req.params.id);
  } else {
    db.prepare("UPDATE policies SET validation_status = 'rejected', status = 'cancelled' WHERE id = ?").run(req.params.id);
  }
  res.json({ ok: true });
});

/* ── CSV export ── */
insurerRouter.get('/claims/export', (req, res) => {
  const insurer = getInsurer(req, res);
  if (!insurer) return;
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.*, u.name as user_name, u.email as user_email, p.policy_number
    FROM claims c JOIN users u ON c.user_id=u.id JOIN policies p ON c.policy_id=p.id
    WHERE p.insurer = ? ORDER BY c.created_at DESC
  `).all(insurer) as any[];
  const headers = ['ID','Título','Cliente','Email','Apólice','Tipo','Estado','Data Sinistro','Estimativa','Valor Aprovado','Score Fraude','Criado em'];
  const csv = [
    headers.join(';'),
    ...rows.map((r: any) => [
      r.id, r.title, r.user_name, r.user_email, r.policy_number,
      r.type, r.status, r.incident_date,
      r.estimated_amount ?? '', r.approved_amount ?? '', r.fraud_score, r.created_at.slice(0,10),
    ].map((v: any) => `"${String(v ?? '').replace(/"/g,'""')}"`).join(';')),
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="sinistros-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send('\uFEFF' + csv);
});

/* ── Claim action ── */
insurerRouter.put('/claims/:id/action', (req, res) => {
  const insurer = getInsurer(req, res);
  if (!insurer) return;
  const { action, amount, reason, message, expertName, expertPhone } = req.body;
  const db = getDb();
  const claim = db.prepare(`
    SELECT c.*, u.id as uid FROM claims c
    JOIN policies p ON c.policy_id=p.id
    JOIN users u ON c.user_id=u.id
    WHERE c.id=? AND p.insurer=?
  `).get(req.params.id, insurer) as any;
  if (!claim) return res.status(404).json({ error: 'Sinistro não encontrado' });
  const now = new Date().toISOString();
  const notifId = uuid(); const eventId = uuid();
  let newStatus = claim.status;
  let eventTitle = '', eventDesc = '', notifTitle = '', notifBody = '', notifType = 'info';

  if (action === 'approve') {
    const approved = amount != null ? Number(amount) : claim.estimated_amount;
    db.prepare('UPDATE claims SET status=?,approved_amount=?,updated_at=? WHERE id=?').run('approved', approved, now, claim.id);
    newStatus = 'approved';
    eventTitle = 'Sinistro aprovado'; eventDesc = `Participação aprovada. Valor: €${Number(approved).toLocaleString('pt-PT')}.`;
    notifTitle = '✅ Sinistro aprovado'; notifBody = `A sua participação "${claim.title}" foi aprovada. Valor: €${Number(approved).toLocaleString('pt-PT')}.`; notifType = 'success';
  } else if (action === 'reject') {
    db.prepare('UPDATE claims SET status=?,updated_at=? WHERE id=?').run('rejected', now, claim.id);
    newStatus = 'rejected';
    eventTitle = 'Sinistro rejeitado'; eventDesc = reason ?? 'Participação rejeitada pela seguradora.';
    notifTitle = '❌ Sinistro rejeitado'; notifBody = `A sua participação "${claim.title}" foi rejeitada. ${reason ?? ''}`.trim(); notifType = 'error';
  } else if (action === 'request_docs') {
    const msg = message ?? 'Por favor envie documentação adicional para prosseguir com a análise.';
    db.prepare('INSERT INTO claim_messages (id,claim_id,role,text,created_at) VALUES (?,?,?,?,?)').run(uuid(), claim.id, 'adjuster', msg, now);
    db.prepare('INSERT INTO claim_events (id,claim_id,status,title,description,created_at) VALUES (?,?,?,?,?,?)').run(eventId, claim.id, claim.status, 'Documentação solicitada', msg, now);
    db.prepare('INSERT INTO notifications (id,user_id,title,body,type,claim_id,created_at) VALUES (?,?,?,?,?,?,?)').run(notifId, claim.uid, '📄 Documentação solicitada', `A seguradora solicitou documentação adicional para "${claim.title}".`, 'warning', claim.id, now);
    return res.json({ ok: true, newStatus: claim.status });
  } else if (action === 'assign_expert') {
    const expert = expertName ?? 'Perito ClaimFast';
    db.prepare('UPDATE claims SET status=?,expert_name=?,expert_phone=?,updated_at=? WHERE id=?').run('expert_assigned', expert, expertPhone ?? null, now, claim.id);
    newStatus = 'expert_assigned';
    eventTitle = 'Perito atribuído'; eventDesc = `${expert} foi atribuído para avaliar o sinistro.`;
    notifTitle = '👷 Perito atribuído'; notifBody = `${expert} foi atribuído para avaliar "${claim.title}".`; notifType = 'info';
  } else if (action === 'mark_paid') {
    db.prepare('UPDATE claims SET status=?,updated_at=? WHERE id=?').run('paid', now, claim.id);
    newStatus = 'paid';
    eventTitle = 'Pagamento efetuado'; eventDesc = `Pagamento de €${Number(claim.approved_amount ?? claim.estimated_amount).toLocaleString('pt-PT')} processado.`;
    notifTitle = '💰 Pagamento efetuado'; notifBody = `O pagamento da sua participação "${claim.title}" foi processado.`; notifType = 'success';
  } else {
    return res.status(400).json({ error: 'Ação inválida' });
  }
  db.prepare('INSERT INTO claim_events (id,claim_id,status,title,description,created_at) VALUES (?,?,?,?,?,?)').run(eventId, claim.id, newStatus, eventTitle, eventDesc, now);
  db.prepare('INSERT INTO notifications (id,user_id,title,body,type,claim_id,created_at) VALUES (?,?,?,?,?,?,?)').run(notifId, claim.uid, notifTitle, notifBody, notifType, claim.id, now);
  res.json({ ok: true, newStatus });
});

/* ── Internal notes ── */
insurerRouter.post('/claims/:id/notes', (req, res) => {
  const insurer = getInsurer(req, res);
  if (!insurer) return;
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Nota vazia' });
  const db = getDb();
  const claim = db.prepare('SELECT c.id,c.internal_notes FROM claims c JOIN policies p ON c.policy_id=p.id WHERE c.id=? AND p.insurer=?').get(req.params.id, insurer) as any;
  if (!claim) return res.status(404).json({ error: 'Sinistro não encontrado' });
  const notes: any[] = JSON.parse(claim.internal_notes ?? '[]');
  notes.push({ text: text.trim(), created_at: new Date().toISOString() });
  db.prepare('UPDATE claims SET internal_notes=? WHERE id=?').run(JSON.stringify(notes), req.params.id);
  res.json({ notes });
});

/* ── Repair shop network ── */
insurerRouter.get('/repair-shops', (_req, res) => res.json(REPAIR_SHOPS));

/* ── Pre-authorize repair at shop ── */
insurerRouter.post('/repair-shops/:shopId/authorize', (req, res) => {
  const shop = REPAIR_SHOPS.find(s => s.id === req.params.shopId);
  if (!shop) return res.status(404).json({ error: 'Oficina não encontrada' });
  const { claimId, estimatedAmount } = req.body;
  res.json({
    authorizationCode: `CF-AUTH-${Date.now().toString(36).toUpperCase()}`,
    shop, claimId, estimatedAmount,
    validUntil: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    message: `Reparação pré-autorizada na ${shop.name}. Código válido por 7 dias.`,
  });
});
