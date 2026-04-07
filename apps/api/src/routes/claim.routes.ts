import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { analyzeClaimText, checkCoverage } from '../services/claim-analyzer.service';
import { calculateFraudScore } from '../services/fraud.service';

export const claimRouter = Router();
claimRouter.use(requireAuth);

/* ── List claims ── */
claimRouter.get('/', (req: AuthRequest, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.*, p.type as policy_type, p.insurer, p.policy_number,
           p.plate, p.vehicle_make, p.vehicle_model, p.address
    FROM claims c JOIN policies p ON c.policy_id = p.id
    WHERE c.user_id = ? ORDER BY c.created_at DESC
  `).all(req.userId) as any[];

  const claims = rows.map(r => ({
    ...r,
    ai_analysis:   r.ai_analysis   ? JSON.parse(r.ai_analysis)   : null,
    fraud_factors: r.fraud_factors ? JSON.parse(r.fraud_factors) : [],
    photos: JSON.parse(r.photos ?? '[]'),
  }));
  res.json(claims);
});

/* ── Get single claim ── */
claimRouter.get('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const row = db.prepare(`
    SELECT c.*, p.type as policy_type, p.insurer, p.policy_number,
           p.plate, p.vehicle_make, p.vehicle_model, p.address, p.coverages
    FROM claims c JOIN policies p ON c.policy_id = p.id
    WHERE c.id = ? AND c.user_id = ?
  `).get(req.params.id, req.userId) as any;
  if (!row) return res.status(404).json({ error: 'Sinistro não encontrado' });

  const events   = db.prepare('SELECT * FROM claim_events WHERE claim_id = ? ORDER BY created_at').all(req.params.id);
  const messages = db.prepare('SELECT * FROM claim_messages WHERE claim_id = ? ORDER BY created_at').all(req.params.id);

  res.json({
    ...row,
    ai_analysis: row.ai_analysis ? JSON.parse(row.ai_analysis) : null,
    coverages: JSON.parse(row.coverages ?? '[]'),
    photos: JSON.parse(row.photos ?? '[]'),
    events,
    messages,
  });
});

/* ── Analyze text (pre-submit) ── */
claimRouter.post('/analyze', (req: AuthRequest, res) => {
  const { text, policyId } = req.body;
  if (!text) return res.status(400).json({ error: 'Texto obrigatório' });

  const db = getDb();
  const policy = db.prepare('SELECT * FROM policies WHERE id = ? AND user_id = ?').get(policyId, req.userId) as any;

  const analysis = analyzeClaimText(text);

  let coverageResult = { covered: false, reason: 'Apólice não encontrada' };
  if (policy) {
    const coverages = JSON.parse(policy.coverages ?? '[]');
    coverageResult = checkCoverage(analysis.incidentType, coverages);
  }

  res.json({ analysis, coverage: coverageResult });
});

/* ── Submit claim ── */
claimRouter.post('/', (req: AuthRequest, res) => {
  const { policyId, description, incidentDate, incidentLocation, photos } = req.body;
  if (!policyId || !description || !incidentDate) {
    return res.status(400).json({ error: 'Campos obrigatórios em falta' });
  }

  const db = getDb();
  const policy = db.prepare('SELECT * FROM policies WHERE id = ? AND user_id = ?').get(policyId, req.userId) as any;
  if (!policy) return res.status(404).json({ error: 'Apólice não encontrada' });

  const analysis   = analyzeClaimText(description);
  const coverages  = JSON.parse(policy.coverages ?? '[]');
  const coverageResult = checkCoverage(analysis.incidentType, coverages);

  // Count previous claims in last 12 months
  const prevCount = (db.prepare(
    "SELECT COUNT(*) as n FROM claims WHERE user_id = ? AND created_at >= date('now','-12 months')"
  ).get(req.userId) as any).n ?? 0;

  const fraud = calculateFraudScore({
    description,
    incidentDate,
    submittedAt: new Date().toISOString(),
    estimatedAmount: analysis.estimatedAmount,
    incidentType: analysis.incidentType,
    severity: analysis.severity,
    policyStartDate: policy.start_date,
    previousClaimsCount: prevCount,
    hasLocation: !!(incidentLocation || analysis.location),
    hasPhotos: (photos ?? []).length > 0,
  });

  const claimId = uuid();
  const now     = new Date().toISOString();

  db.prepare(`
    INSERT INTO claims (id,user_id,policy_id,type,status,title,description,incident_date,incident_location,ai_analysis,is_covered,coverage_reason,estimated_amount,photos,fraud_score,fraud_factors,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    claimId, req.userId, policyId,
    analysis.incidentType, 'submitted',
    analysis.suggestedTitle, description,
    incidentDate, incidentLocation ?? analysis.location,
    JSON.stringify(analysis),
    coverageResult.covered ? 1 : 0,
    coverageResult.reason,
    analysis.estimatedAmount,
    JSON.stringify(photos ?? []),
    fraud.score, JSON.stringify(fraud.factors),
    now, now,
  );

  // Initial timeline event
  db.prepare(`INSERT INTO claim_events (id,claim_id,status,title,description,created_at) VALUES (?,?,?,?,?,?)`)
    .run(uuid(), claimId, 'submitted', 'Participação submetida',
      `Participação recebida e registada. Cobertura ${coverageResult.covered ? 'confirmada' : 'não confirmada'}.`, now);

  // Auto system message
  db.prepare(`INSERT INTO claim_messages (id,claim_id,role,text,created_at) VALUES (?,?,?,?,?)`)
    .run(uuid(), claimId, 'system',
      coverageResult.covered
        ? `✅ Participação registada. ${coverageResult.reason}. Estimativa inicial: €${analysis.estimatedAmount.toLocaleString('pt-PT')}.`
        : `⚠️ Participação registada. ${coverageResult.reason}`,
      now);

  // Simulate progression after 2s (under_review)
  setTimeout(() => {
    try {
      const eventNow = new Date().toISOString();
      db.prepare('UPDATE claims SET status=?, updated_at=? WHERE id=?').run('under_review', eventNow, claimId);
      db.prepare(`INSERT INTO claim_events (id,claim_id,status,title,description,created_at) VALUES (?,?,?,?,?,?)`)
        .run(uuid(), claimId, 'under_review', 'Em análise', 'A sua participação está a ser analisada pela nossa equipa.', eventNow);
    } catch {}
  }, 3000);

  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(claimId) as any;
  res.status(201).json({
    ...claim,
    ai_analysis: JSON.parse(claim.ai_analysis ?? 'null'),
    photos: JSON.parse(claim.photos ?? '[]'),
  });
});

/* ── Send message on claim ── */
claimRouter.post('/:id/messages', (req: AuthRequest, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Mensagem vazia' });

  const db = getDb();
  const claim = db.prepare('SELECT id FROM claims WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!claim) return res.status(404).json({ error: 'Sinistro não encontrado' });

  const msgId = uuid();
  const now   = new Date().toISOString();
  db.prepare('INSERT INTO claim_messages (id,claim_id,role,text,created_at) VALUES (?,?,?,?,?)')
    .run(msgId, req.params.id, 'customer', text, now);

  // Auto-reply
  setTimeout(() => {
    try {
      db.prepare('INSERT INTO claim_messages (id,claim_id,role,text,created_at) VALUES (?,?,?,?,?)')
        .run(uuid(), req.params.id, 'adjuster',
          'Obrigado pela sua mensagem. A sua questão foi registada e será respondida em breve pelo gestor do processo.',
          new Date().toISOString());
    } catch {}
  }, 1500);

  res.status(201).json({ id: msgId, claim_id: req.params.id, role: 'customer', text, created_at: now });
});
