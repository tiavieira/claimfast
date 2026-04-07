import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { runMigrations } from '../migrate';
import { getDb } from '../connection';
import { calculateFraudScore } from '../../services/fraud.service';

runMigrations();
const db = getDb();

db.exec(`
  DELETE FROM claim_messages;
  DELETE FROM claim_events;
  DELETE FROM claims;
  DELETE FROM policies;
  DELETE FROM users;
`);

const hash = bcrypt.hashSync('Demo1234!', 10);

/* ── Users ── */
const joaoId  = uuid();
const mariaId = uuid();
const pedroId = uuid();
const anaId   = uuid();
const carlosId = uuid();

for (const [id, email, name, phone, nif] of [
  [joaoId,   'joao@demo.pt',   'João Silva',    '+351 912 345 678', '123456789'],
  [mariaId,  'maria@demo.pt',  'Maria Santos',  '+351 963 456 789', '987654321'],
  [pedroId,  'pedro@demo.pt',  'Pedro Costa',   '+351 934 567 890', '456789123'],
  [anaId,    'ana@demo.pt',    'Ana Ferreira',  '+351 916 789 012', '321654987'],
  [carlosId, 'carlos@demo.pt', 'Carlos Mendes', '+351 961 234 567', '654321098'],
]) {
  db.prepare(`INSERT INTO users (id,email,name,password_hash,phone,nif) VALUES (?,?,?,?,?,?)`).run(id, email, name, hash, phone, nif);
}

/* ── Policies ── */
const autoCoverages = JSON.stringify([
  { code: 'collision', label: 'Danos por colisão', limit: 15000, deductible: 300 },
  { code: 'theft',     label: 'Furto e roubo',     limit: 12000, deductible: 500 },
  { code: 'fire',      label: 'Incêndio',           limit: 12000, deductible: 0 },
  { code: 'glass',     label: 'Quebra de vidros',   limit: 800,   deductible: 0 },
  { code: 'liability', label: 'Responsabilidade civil', limit: 50000, deductible: 0 },
  { code: 'roadside',  label: 'Assistência em viagem', limit: 1000, deductible: 0 },
]);
const homeCoverages = JSON.stringify([
  { code: 'fire',      label: 'Incêndio e explosão',      limit: 120000, deductible: 0 },
  { code: 'flood',     label: 'Inundação e danos por água', limit: 20000, deductible: 200 },
  { code: 'theft',     label: 'Furto e roubo de conteúdo', limit: 8000, deductible: 200 },
  { code: 'liability', label: 'Responsabilidade civil familiar', limit: 75000, deductible: 0 },
  { code: 'glass',     label: 'Quebra de vidros e estores', limit: 2000, deductible: 0 },
]);
const healthCoverages = JSON.stringify([
  { code: 'consultation', label: 'Consultas médicas',     limit: 5000,  deductible: 5 },
  { code: 'hospital',     label: 'Internamento',          limit: 50000, deductible: 0 },
  { code: 'surgery',      label: 'Cirurgias',             limit: 30000, deductible: 0 },
  { code: 'dental',       label: 'Medicina dentária',     limit: 1500,  deductible: 20 },
  { code: 'exams',        label: 'Análises e exames',     limit: 2000,  deductible: 0 },
]);

const p = {
  joaoAuto:   uuid(), joaoHome:  uuid(),
  mariaHealth: uuid(),
  pedroAuto:  uuid(), pedroHealth: uuid(),
  anaAuto:    uuid(), anaHome:   uuid(),
  carlosAuto: uuid(),
};

db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.joaoAuto, joaoId, 'auto', 'Fidelidade', 'FID-AUTO-2024-88231', 'João Silva', '2022-01-15', '2025-01-15', 42.50, 'active', '45-AA-23', 'Toyota', 'Yaris', 2019, autoCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,address,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.joaoHome, joaoId, 'home', 'Allianz', 'ALZ-HAB-2023-44892', 'João Silva', '2021-06-01', '2026-06-01', 28.00, 'active', 'Rua das Flores 12, Lisboa', homeCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.mariaHealth, mariaId, 'health', 'Médis', 'MED-SAU-2024-17654', 'Maria Santos', '2024-03-01', '2025-03-01', 65.00, 'active', healthCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.pedroAuto, pedroId, 'auto', 'Tranquilidade', 'TRQ-AUTO-2024-55012', 'Pedro Costa', '2023-08-01', '2025-02-01', 38.75, 'active', '78-CC-19', 'Volkswagen', 'Golf', 2021, autoCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.pedroHealth, pedroId, 'health', 'AdvanceCare', 'ADV-SAU-2023-98234', 'Pedro Costa', '2023-09-01', '2026-09-01', 52.00, 'active', healthCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.anaAuto, anaId, 'auto', 'Fidelidade', 'FID-AUTO-2024-91034', 'Ana Ferreira', '2024-09-01', '2025-09-01', 55.00, 'active', '12-XY-34', 'BMW', 'Série 3', 2022, autoCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,address,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.anaHome, anaId, 'home', 'Fidelidade', 'FID-HAB-2024-20451', 'Ana Ferreira', '2020-03-01', '2025-03-01', 35.00, 'active', 'Av. da Liberdade 88, Lisboa', homeCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.carlosAuto, carlosId, 'auto', 'Allianz', 'ALZ-AUTO-2024-33901', 'Carlos Mendes', '2024-10-01', '2025-10-01', 48.00, 'active', '99-ZZ-01', 'Mercedes', 'Classe C', 2020, autoCoverages);

/* ── Helper ── */
const insertClaim  = db.prepare(`INSERT INTO claims (id,user_id,policy_id,type,status,title,description,incident_date,incident_location,ai_analysis,is_covered,coverage_reason,estimated_amount,approved_amount,expert_name,expert_phone,photos,fraud_score,fraud_factors,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const insertEvent  = db.prepare(`INSERT INTO claim_events (id,claim_id,status,title,description,created_at) VALUES (?,?,?,?,?,?)`);
const insertMsg    = db.prepare(`INSERT INTO claim_messages (id,claim_id,role,text,created_at) VALUES (?,?,?,?,?)`);

function makeClaim(opts: {
  userId: string; policyId: string; type: string; status: string;
  title: string; description: string; incidentDate: string; incidentLocation?: string;
  estimatedAmount: number; approvedAmount?: number;
  expertName?: string; expertPhone?: string;
  photos?: string[]; isCovered?: boolean; policyStartDate: string;
  previousClaimsCount?: number; createdAt?: string;
}) {
  const id  = uuid();
  const now = opts.createdAt ?? new Date().toISOString();
  const fraud = calculateFraudScore({
    description: opts.description,
    incidentDate: opts.incidentDate,
    submittedAt: now,
    estimatedAmount: opts.estimatedAmount,
    incidentType: opts.type,
    severity: opts.estimatedAmount > 5000 ? 'high' : opts.estimatedAmount > 1500 ? 'medium' : 'low',
    policyStartDate: opts.policyStartDate,
    previousClaimsCount: opts.previousClaimsCount ?? 0,
    hasLocation: !!opts.incidentLocation,
    hasPhotos: (opts.photos ?? []).length > 0,
  });
  const ai = JSON.stringify({ incidentType: opts.type, severity: opts.estimatedAmount > 5000 ? 'high' : 'medium', estimatedAmount: opts.estimatedAmount, confidence: 0.89 });
  insertClaim.run(
    id, opts.userId, opts.policyId, opts.type, opts.status,
    opts.title, opts.description, opts.incidentDate, opts.incidentLocation ?? null,
    ai, opts.isCovered !== false ? 1 : 0,
    opts.isCovered !== false ? 'Coberto pela apólice' : 'Fora da cobertura',
    opts.estimatedAmount, opts.approvedAmount ?? null,
    opts.expertName ?? null, opts.expertPhone ?? null,
    JSON.stringify(opts.photos ?? []),
    fraud.score, JSON.stringify(fraud.factors),
    now, now,
  );
  return { id, fraud, now };
}

function addEvents(claimId: string, status: string, baseDate: string) {
  const d = new Date(baseDate);
  const advance = (h: number) => { d.setHours(d.getHours() + h); return new Date(d).toISOString(); };
  insertEvent.run(uuid(), claimId, 'submitted', 'Participação submetida', 'Participação recebida e registada.', advance(0));
  if (['under_review','expert_assigned','approved','paid','rejected'].includes(status)) {
    insertEvent.run(uuid(), claimId, 'under_review', 'Em análise', 'A participação está a ser analisada.', advance(20));
  }
  if (['expert_assigned','approved','paid'].includes(status)) {
    insertEvent.run(uuid(), claimId, 'expert_assigned', 'Perito atribuído', 'Perito designado ao processo.', advance(24));
  }
  if (['approved','paid'].includes(status)) {
    insertEvent.run(uuid(), claimId, 'approved', 'Sinistro aprovado', 'Indemnização aprovada.', advance(48));
  }
  if (status === 'paid') {
    insertEvent.run(uuid(), claimId, 'paid', 'Pagamento efetuado', 'Transferência realizada para o seu IBAN.', advance(24));
  }
  if (status === 'rejected') {
    insertEvent.run(uuid(), claimId, 'rejected', 'Sinistro rejeitado', 'Participação não aprovada após análise.', advance(24));
  }
}

/* ── 22 demo claims across all users ── */

// João – low risk claims (legitimate)
const c1 = makeClaim({ userId: joaoId, policyId: p.joaoAuto, type: 'collision', status: 'approved', title: 'Colisão traseira na A2', description: 'Estava parado no trânsito na A2 quando um veículo me embateu pela retaguarda. Danos visíveis no para-choques traseiro e na mala do carro. O outro condutor assumiu a culpa e trocámos dados. Chamei a GNR que elaborou auto de ocorrência.', incidentDate: '2024-11-10T09:30:00Z', incidentLocation: 'A2, km 34, Setúbal', estimatedAmount: 1240, approvedAmount: 1100, expertName: 'Eng. António Ferreira', expertPhone: '+351 210 234 567', photos: ['Para-choques traseiro', 'Auto de ocorrência'], policyStartDate: '2022-01-15', previousClaimsCount: 0, createdAt: '2024-11-10T09:35:00Z' });
addEvents(c1.id, 'approved', '2024-11-10T09:35:00Z');

const c2 = makeClaim({ userId: joaoId, policyId: p.joaoHome, type: 'flood', status: 'expert_assigned', title: 'Inundação por rotura de cano', description: 'Rotura de cano no andar superior causou inundação na sala e cozinha. O soalho de madeira ficou completamente danificado assim como vários móveis e eletrodomésticos. Chamei imediatamente um técnico que cortou a água e confirmou a origem da avaria.', incidentDate: '2024-12-03T14:00:00Z', incidentLocation: 'Rua das Flores 12, Lisboa', estimatedAmount: 8500, expertName: 'Arq. Sofia Lopes', expertPhone: '+351 210 567 890', photos: ['Sala afetada', 'Origem da rotura'], policyStartDate: '2021-06-01', previousClaimsCount: 1, createdAt: '2024-12-03T14:15:00Z' });
addEvents(c2.id, 'expert_assigned', '2024-12-03T14:15:00Z');

// Maria – health claims
const c3 = makeClaim({ userId: mariaId, policyId: p.mariaHealth, type: 'consultation', status: 'paid', title: 'Consulta de ortopedia', description: 'Consulta de especialidade de ortopedia no Hospital da Luz para avaliação de lesão no joelho direito após queda durante exercício físico. O médico prescreveu fisioterapia e solicitou ressonância magnética.', incidentDate: '2024-10-22T16:00:00Z', incidentLocation: 'Hospital da Luz, Lisboa', estimatedAmount: 85, approvedAmount: 80, photos: ['Fatura consulta', 'Prescrição médica'], policyStartDate: '2024-03-01', previousClaimsCount: 0, createdAt: '2024-10-22T16:30:00Z' });
addEvents(c3.id, 'paid', '2024-10-22T16:30:00Z');

const c4 = makeClaim({ userId: mariaId, policyId: p.mariaHealth, type: 'surgery', status: 'approved', title: 'Artroscopia ao joelho', description: 'Após consulta de ortopedia e ressonância magnética confirmou-se lesão no menisco. O médico ortopedista indicou necessidade de artroscopia. Cirurgia realizada com sucesso no Hospital CUF Descobertas.', incidentDate: '2024-11-15T09:00:00Z', incidentLocation: 'Hospital CUF Descobertas, Lisboa', estimatedAmount: 4200, approvedAmount: 4000, photos: ['Relatório cirúrgico', 'Fatura hospital'], policyStartDate: '2024-03-01', previousClaimsCount: 1, createdAt: '2024-11-15T11:00:00Z' });
addEvents(c4.id, 'approved', '2024-11-15T11:00:00Z');

// Pedro – medium risk
const c5 = makeClaim({ userId: pedroId, policyId: p.pedroAuto, type: 'theft', status: 'under_review', title: 'Furto do veículo', description: 'O meu carro foi furtado. Estava estacionado. Não sei bem o que aconteceu, acho que foi durante a noite. Participei à polícia.', incidentDate: '2024-12-15T03:00:00Z', incidentLocation: 'Lisboa', estimatedAmount: 15000, policyStartDate: '2023-08-01', previousClaimsCount: 0, createdAt: '2024-12-15T08:00:00Z' });
addEvents(c5.id, 'under_review', '2024-12-15T08:00:00Z');

const c6 = makeClaim({ userId: pedroId, policyId: p.pedroHealth, type: 'consultation', status: 'paid', title: 'Consulta de medicina geral', description: 'Consulta de medicina geral e familiar por quadro gripal com febre alta. Médico prescreveu antibiótico e baixa médica de 3 dias.', incidentDate: '2024-09-10T10:00:00Z', incidentLocation: 'Centro de Saúde de Cascais', estimatedAmount: 45, approvedAmount: 40, photos: ['Fatura'], policyStartDate: '2023-09-01', previousClaimsCount: 0, createdAt: '2024-09-10T11:00:00Z' });
addEvents(c6.id, 'paid', '2024-09-10T11:00:00Z');

// Ana – HIGH FRAUD RISK claims
const c7 = makeClaim({ userId: anaId, policyId: p.anaAuto, type: 'collision', status: 'under_review', title: 'Colisão / Acidente de viação', description: 'Bati. Danos.', incidentDate: '2024-12-20T02:30:00Z', estimatedAmount: 12000, policyStartDate: '2024-09-01', previousClaimsCount: 3, createdAt: '2024-12-20T02:45:00Z' });
addEvents(c7.id, 'under_review', '2024-12-20T02:45:00Z');

const c8 = makeClaim({ userId: anaId, policyId: p.anaHome, type: 'theft', status: 'submitted', title: 'Furto e roubo', description: 'Roubaram tudo. Não sei o que aconteceu talvez tenham entrado pela janela. Perda total de todos os bens.', incidentDate: '2024-12-28T23:00:00Z', estimatedAmount: 8000, policyStartDate: '2020-03-01', previousClaimsCount: 3, createdAt: '2024-12-28T23:10:00Z' });
addEvents(c8.id, 'submitted', '2024-12-28T23:10:00Z');

const c9 = makeClaim({ userId: anaId, policyId: p.anaAuto, type: 'glass', status: 'paid', title: 'Quebra de vidros', description: 'O para-brisas partiu. Pedra na autoestrada.', incidentDate: '2024-10-05T08:00:00Z', incidentLocation: 'A1, km 15', estimatedAmount: 600, approvedAmount: 600, photos: ['Para-brisas partido'], policyStartDate: '2024-09-01', previousClaimsCount: 0, createdAt: '2024-10-05T09:00:00Z' });
addEvents(c9.id, 'paid', '2024-10-05T09:00:00Z');

// Carlos – CRITICAL FRAUD
const c10 = makeClaim({ userId: carlosId, policyId: p.carlosAuto, type: 'theft', status: 'under_review', title: 'Furto e roubo', description: 'Carro roubado. Não sei quando. Talvez ontem à noite.', incidentDate: '2024-12-31T22:00:00Z', estimatedAmount: 35000, policyStartDate: '2024-10-01', previousClaimsCount: 0, createdAt: '2024-12-31T22:05:00Z' });
addEvents(c10.id, 'under_review', '2024-12-31T22:05:00Z');

// More claims to populate the dashboard
const moreClaimsData = [
  { userId: joaoId,   policyId: p.joaoAuto,    type: 'glass',       status: 'paid',          title: 'Quebra do para-brisas', description: 'Pedra projetada por caminhão na A8 danificou o para-brisas. Substituição necessária por oficina autorizada.', incidentDate: '2024-08-14T11:00:00Z', incidentLocation: 'A8, km 22', estimatedAmount: 550, approvedAmount: 550, photos: ['Para-brisas'], policyStartDate: '2022-01-15', prevClaims: 0, created: '2024-08-14T11:30:00Z' },
  { userId: mariaId,  policyId: p.mariaHealth,  type: 'exams',       status: 'paid',          title: 'Análises clínicas', description: 'Análises clínicas de rotina prescritas pelo médico de família. Inclui hemograma completo, bioquímica e análises de urina.', incidentDate: '2024-07-03T09:00:00Z', incidentLocation: 'Laboratório Synlab', estimatedAmount: 120, approvedAmount: 120, photos: ['Requisição médica'], policyStartDate: '2024-03-01', prevClaims: 0, created: '2024-07-03T10:00:00Z' },
  { userId: pedroId,  policyId: p.pedroAuto,    type: 'liability',   status: 'approved',      title: 'Responsabilidade civil', description: 'Embati numa vedação ao fazer uma manobra de estacionamento num parque privado. O proprietário apresentou orçamento de reparação e documentação do dano.', incidentDate: '2024-09-20T16:00:00Z', incidentLocation: 'Cascais Retail Park', estimatedAmount: 750, approvedAmount: 680, photos: ['Vedação danificada', 'Orçamento'], policyStartDate: '2023-08-01', prevClaims: 0, created: '2024-09-20T17:00:00Z' },
  { userId: anaId,    policyId: p.anaAuto,      type: 'collision',   status: 'rejected',      title: 'Colisão / Acidente de viação', description: 'Acho que bati noutro carro. Não tenho certeza dos danos.', incidentDate: '2024-11-03T01:00:00Z', estimatedAmount: 5000, policyStartDate: '2024-09-01', prevClaims: 1, created: '2024-11-03T01:20:00Z' },
  { userId: carlosId, policyId: p.carlosAuto,   type: 'collision',   status: 'under_review',  title: 'Colisão / Acidente de viação', description: 'Colisão frontal com outro veículo numa intersecção. Airbags dispararam. Veículo com danos significativos na frente. Ferimentos ligeiros no condutor. Polícia no local.', incidentDate: '2024-12-18T14:30:00Z', incidentLocation: 'Rotunda do Marquês, Lisboa', estimatedAmount: 9500, photos: ['Frente do veículo', 'Airbag', 'Auto de acidente'], policyStartDate: '2024-10-01', prevClaims: 0, created: '2024-12-18T15:00:00Z' },
  { userId: joaoId,   policyId: p.joaoHome,     type: 'glass',       status: 'paid',          title: 'Quebra de estores', description: 'Temporal com ventos fortes partiu dois estores exteriores da fachada. Os estores ficaram completamente inutilizáveis e necessitam substituição.', incidentDate: '2024-10-29T07:00:00Z', incidentLocation: 'Rua das Flores 12, Lisboa', estimatedAmount: 380, approvedAmount: 380, photos: ['Estores partidos'], policyStartDate: '2021-06-01', prevClaims: 1, created: '2024-10-29T09:00:00Z' },
  { userId: mariaId,  policyId: p.mariaHealth,  type: 'dental',      status: 'approved',      title: 'Tratamento dentário', description: 'Extração e implante dentário após fratura de dente. Tratamento realizado em clínica dentária conveniada. Inclui radiografia, extração, colocação de implante e prótese provisória.', incidentDate: '2024-12-05T10:00:00Z', incidentLocation: 'Clínica Dental Plus, Porto', estimatedAmount: 1200, approvedAmount: 1100, photos: ['Orçamento clínica'], policyStartDate: '2024-03-01', prevClaims: 2, created: '2024-12-05T11:00:00Z' },
  { userId: pedroId,  policyId: p.pedroAuto,    type: 'fire',        status: 'expert_assigned', title: 'Incêndio', description: 'Incêndio no habitáculo originado por curto-circuito no sistema elétrico. O veículo foi destruído quase na totalidade. Bombeiros chamados ao local e elaboraram relatório.', incidentDate: '2024-11-28T20:00:00Z', incidentLocation: 'Av. de Ceuta, Lisboa', estimatedAmount: 18000, expertName: 'Eng. Rui Oliveira', expertPhone: '+351 210 890 123', photos: ['Veículo destruído', 'Relatório bombeiros'], policyStartDate: '2023-08-01', prevClaims: 1, created: '2024-11-28T20:45:00Z' },
  { userId: anaId,    policyId: p.anaHome,      type: 'flood',       status: 'submitted',     title: 'Inundação / Danos por água', description: 'Inundação. Não sei a causa. Talvez chuva.', incidentDate: '2024-12-30T04:00:00Z', estimatedAmount: 12000, policyStartDate: '2020-03-01', prevClaims: 3, created: '2024-12-30T04:15:00Z' },
  { userId: carlosId, policyId: p.carlosAuto,   type: 'glass',       status: 'submitted',     title: 'Quebra de vidros', description: 'Objeto atirado ao para-brisas enquanto conduzia na cidade. O vidro ficou completamente partido, impossibilitando a condução. Chamei assistência em viagem.', incidentDate: '2025-01-02T17:00:00Z', incidentLocation: 'Av. Almirante Reis, Lisboa', estimatedAmount: 650, photos: ['Para-brisas'], policyStartDate: '2024-10-01', prevClaims: 0, created: '2025-01-02T17:30:00Z' },
  { userId: joaoId,   policyId: p.joaoAuto,     type: 'roadside',    status: 'paid',          title: 'Assistência em viagem', description: 'Avaria do veículo na autoestrada por problema mecânico na caixa de velocidades. Solicitei assistência em viagem. Reboque para oficina autorizada e viatura de substituição por 3 dias.', incidentDate: '2024-09-05T18:00:00Z', incidentLocation: 'A1, km 45, Santarém', estimatedAmount: 320, approvedAmount: 320, photos: ['Viatura em avaria'], policyStartDate: '2022-01-15', prevClaims: 0, created: '2024-09-05T18:30:00Z' },
];

for (const c of moreClaimsData) {
  const fraud = calculateFraudScore({
    description: c.description, incidentDate: c.incidentDate,
    submittedAt: c.created, estimatedAmount: c.estimatedAmount,
    incidentType: c.type, severity: c.estimatedAmount > 5000 ? 'high' : 'medium',
    policyStartDate: c.policyStartDate, previousClaimsCount: c.prevClaims,
    hasLocation: !!c.incidentLocation, hasPhotos: (c.photos ?? []).length > 0,
  });
  const claimId = uuid();
  const ai = JSON.stringify({ incidentType: c.type, severity: c.estimatedAmount > 5000 ? 'high' : 'medium', estimatedAmount: c.estimatedAmount, confidence: 0.88 });
  insertClaim.run(
    claimId, c.userId, c.policyId, c.type, c.status, c.title, c.description,
    c.incidentDate, (c as any).incidentLocation ?? null, ai, 1, 'Coberto pela apólice',
    c.estimatedAmount, (c as any).approvedAmount ?? null,
    (c as any).expertName ?? null, (c as any).expertPhone ?? null,
    JSON.stringify(c.photos ?? []),
    fraud.score, JSON.stringify(fraud.factors),
    c.created, c.created,
  );
  addEvents(claimId, c.status, c.created);
}

/* ── Messages for main claims ── */
insertMsg.run(uuid(), c1.id, 'system',   'Participação registada. Nº CF-2024-11-001', '2024-11-10T09:35:00Z');
insertMsg.run(uuid(), c1.id, 'adjuster', 'Bom dia, Sr. Silva. Os danos descritos estão cobertos pela sua apólice. O perito entrará em contacto nas próximas 24h.', '2024-11-12T10:15:00Z');
insertMsg.run(uuid(), c1.id, 'customer', 'Obrigado. Quando recebo o pagamento?', '2024-11-12T11:00:00Z');
insertMsg.run(uuid(), c1.id, 'adjuster', 'Após aprovação o pagamento é efetuado em 3–5 dias úteis diretamente no IBAN que indicou.', '2024-11-12T11:30:00Z');

insertMsg.run(uuid(), c2.id, 'system',   'Participação registada. Nº CF-2024-12-002', '2024-12-03T14:15:00Z');
insertMsg.run(uuid(), c2.id, 'adjuster', 'Boa tarde. A Arq. Sofia Lopes entrará em contacto para agendar vistoria ao imóvel.', '2024-12-05T09:30:00Z');

insertMsg.run(uuid(), c5.id, 'system',   'Participação de furto registada. A participação à PSP é obrigatória para prosseguimento.', '2024-12-15T08:00:00Z');
insertMsg.run(uuid(), c5.id, 'adjuster', 'Sr. Costa, para prosseguir com o processo necessitamos do número de participação policial e cópia do documento do veículo.', '2024-12-15T10:00:00Z');

console.log('✅ Seed concluído');
console.log('   Utilizadores: joao | maria | pedro | ana | carlos @demo.pt (password: Demo1234!)');
console.log('   Apólices: 8 | Sinistros: 22');
console.log('   Token seguradora: insurer-demo-2024');
