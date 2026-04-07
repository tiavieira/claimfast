import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { runMigrations } from '../migrate';
import { getDb } from '../connection';
import { calculateFraudScore } from '../../services/fraud.service';

runMigrations();
const db = getDb();

db.exec(`
  DELETE FROM notifications;
  DELETE FROM claim_messages;
  DELETE FROM claim_events;
  DELETE FROM claims;
  DELETE FROM policies;
  DELETE FROM users;
`);

const hash = bcrypt.hashSync('Demo1234!', 10);

/* ── Users ── */
const joaoId    = uuid();
const mariaId   = uuid();
const pedroId   = uuid();
const anaId     = uuid();
const carlosId  = uuid();
const ruiId     = uuid();
const sofiaId   = uuid();
const miguelId  = uuid();
const inesId    = uuid();
const pauloId   = uuid();
const beatrizId = uuid();
const fernandoId= uuid();

for (const [id, email, name, phone, nif] of [
  [joaoId,     'joao@demo.pt',     'João Silva',       '+351 912 345 678', '123456789'],
  [mariaId,    'maria@demo.pt',    'Maria Santos',     '+351 963 456 789', '987654321'],
  [pedroId,    'pedro@demo.pt',    'Pedro Costa',      '+351 934 567 890', '456789123'],
  [anaId,      'ana@demo.pt',      'Ana Ferreira',     '+351 916 789 012', '321654987'],
  [carlosId,   'carlos@demo.pt',   'Carlos Mendes',    '+351 961 234 567', '654321098'],
  [ruiId,      'rui@demo.pt',      'Rui Barbosa',      '+351 919 876 543', '111222333'],
  [sofiaId,    'sofia@demo.pt',    'Sofia Rodrigues',  '+351 962 345 678', '444555666'],
  [miguelId,   'miguel@demo.pt',   'Miguel Oliveira',  '+351 935 678 901', '777888999'],
  [inesId,     'ines@demo.pt',     'Inês Carvalho',    '+351 917 890 123', '222333444'],
  [pauloId,    'paulo@demo.pt',    'Paulo Marques',    '+351 964 567 890', '555666777'],
  [beatrizId,  'beatriz@demo.pt',  'Beatriz Lopes',    '+351 936 789 012', '888999000'],
  [fernandoId, 'fernando@demo.pt', 'Fernando Dias',    '+351 913 456 789', '333444555'],
]) {
  db.prepare(`INSERT INTO users (id,email,name,password_hash,phone,nif) VALUES (?,?,?,?,?,?)`).run(id, email, name, hash, phone, nif);
}

/* ── Coverages ── */
const autoCoverages = JSON.stringify([
  { code: 'collision', label: 'Danos por colisão',        limit: 15000, deductible: 300 },
  { code: 'theft',     label: 'Furto e roubo',            limit: 12000, deductible: 500 },
  { code: 'fire',      label: 'Incêndio',                 limit: 12000, deductible: 0   },
  { code: 'glass',     label: 'Quebra de vidros',         limit: 800,   deductible: 0   },
  { code: 'liability', label: 'Responsabilidade civil',   limit: 50000, deductible: 0   },
  { code: 'roadside',  label: 'Assistência em viagem',    limit: 1000,  deductible: 0   },
]);
const homeCoverages = JSON.stringify([
  { code: 'fire',      label: 'Incêndio e explosão',              limit: 120000, deductible: 0   },
  { code: 'flood',     label: 'Inundação e danos por água',       limit: 20000,  deductible: 200 },
  { code: 'theft',     label: 'Furto e roubo de conteúdo',        limit: 8000,   deductible: 200 },
  { code: 'liability', label: 'Responsabilidade civil familiar',  limit: 75000,  deductible: 0   },
  { code: 'glass',     label: 'Quebra de vidros e estores',       limit: 2000,   deductible: 0   },
]);
const healthCoverages = JSON.stringify([
  { code: 'consultation', label: 'Consultas médicas', limit: 5000,  deductible: 5  },
  { code: 'hospital',     label: 'Internamento',      limit: 50000, deductible: 0  },
  { code: 'surgery',      label: 'Cirurgias',         limit: 30000, deductible: 0  },
  { code: 'dental',       label: 'Medicina dentária', limit: 1500,  deductible: 20 },
  { code: 'exams',        label: 'Análises e exames', limit: 2000,  deductible: 0  },
]);

/* ── Policies ── */
const p: Record<string, string> = {
  joaoAuto:     uuid(), joaoHome:      uuid(),
  mariaHealth:  uuid(),
  pedroAuto:    uuid(), pedroHealth:   uuid(),
  anaAuto:      uuid(), anaHome:       uuid(),
  carlosAuto:   uuid(),
  // Fidelidade extended
  ruiAuto:      uuid(), ruiHome:       uuid(),
  sofiaAuto:    uuid(), sofiaHealth:   uuid(),
  miguelAuto:   uuid(),
  inesHome:     uuid(), inesHealth:    uuid(),
  pauloAuto:    uuid(), pauloHome:     uuid(),
  beatrizAuto:  uuid(), beatrizHealth: uuid(),
  fernandoAuto: uuid(), fernandoHome:  uuid(),
};

// Existing policies
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.joaoAuto, joaoId, 'auto', 'Fidelidade', 'FID-AUTO-2024-88231', 'João Silva', '2022-01-15', '2026-01-15', 42.50, 'active', '45-AA-23', 'Toyota', 'Yaris', 2019, autoCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,address,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.joaoHome, joaoId, 'home', 'Allianz', 'ALZ-HAB-2023-44892', 'João Silva', '2021-06-01', '2026-06-01', 28.00, 'active', 'Rua das Flores 12, Lisboa', homeCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.mariaHealth, mariaId, 'health', 'Médis', 'MED-SAU-2024-17654', 'Maria Santos', '2024-03-01', '2026-03-01', 65.00, 'active', healthCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.pedroAuto, pedroId, 'auto', 'Tranquilidade', 'TRQ-AUTO-2024-55012', 'Pedro Costa', '2023-08-01', '2026-08-01', 38.75, 'active', '78-CC-19', 'Volkswagen', 'Golf', 2021, autoCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.pedroHealth, pedroId, 'health', 'AdvanceCare', 'ADV-SAU-2023-98234', 'Pedro Costa', '2023-09-01', '2026-09-01', 52.00, 'active', healthCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.anaAuto, anaId, 'auto', 'Fidelidade', 'FID-AUTO-2024-91034', 'Ana Ferreira', '2024-09-01', '2025-09-01', 55.00, 'active', '12-XY-34', 'BMW', 'Série 3', 2022, autoCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,address,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.anaHome, anaId, 'home', 'Fidelidade', 'FID-HAB-2024-20451', 'Ana Ferreira', '2020-03-01', '2026-03-01', 35.00, 'active', 'Av. da Liberdade 88, Lisboa', homeCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.carlosAuto, carlosId, 'auto', 'Allianz', 'ALZ-AUTO-2024-33901', 'Carlos Mendes', '2024-10-01', '2025-10-01', 48.00, 'active', '99-ZZ-01', 'Mercedes', 'Classe C', 2020, autoCoverages);

// Extended Fidelidade policies
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.ruiAuto, ruiId, 'auto', 'Fidelidade', 'FID-AUTO-2023-72145', 'Rui Barbosa', '2023-04-01', '2026-04-01', 46.00, 'active', '33-BT-91', 'Renault', 'Megane', 2020, autoCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,address,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.ruiHome, ruiId, 'home', 'Fidelidade', 'FID-HAB-2023-31872', 'Rui Barbosa', '2023-04-01', '2026-04-01', 32.00, 'active', 'Rua de Entrecampos 7, Lisboa', homeCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.sofiaAuto, sofiaId, 'auto', 'Fidelidade', 'FID-AUTO-2024-60291', 'Sofia Rodrigues', '2024-02-01', '2026-02-01', 51.00, 'active', '67-PL-44', 'Peugeot', '308', 2021, autoCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.sofiaHealth, sofiaId, 'health', 'Fidelidade', 'FID-SAU-2024-19023', 'Sofia Rodrigues', '2024-02-01', '2026-02-01', 72.00, 'active', healthCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.miguelAuto, miguelId, 'auto', 'Fidelidade', 'FID-AUTO-2022-48801', 'Miguel Oliveira', '2022-07-01', '2026-07-01', 39.50, 'active', '88-MK-56', 'Ford', 'Focus', 2019, autoCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,address,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.inesHome, inesId, 'home', 'Fidelidade', 'FID-HAB-2021-88734', 'Inês Carvalho', '2021-11-01', '2025-11-01', 29.00, 'active', 'Tv. do Carmo 3, Porto', homeCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.inesHealth, inesId, 'health', 'Fidelidade', 'FID-SAU-2023-55218', 'Inês Carvalho', '2023-01-01', '2026-01-01', 68.00, 'active', healthCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.pauloAuto, pauloId, 'auto', 'Fidelidade', 'FID-AUTO-2023-29904', 'Paulo Marques', '2023-06-01', '2026-06-01', 44.50, 'active', '21-QR-77', 'Seat', 'Leon', 2020, autoCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,address,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.pauloHome, pauloId, 'home', 'Fidelidade', 'FID-HAB-2023-66012', 'Paulo Marques', '2023-06-01', '2026-06-01', 31.00, 'active', 'Rua do Ouro 55, Lisboa', homeCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.beatrizAuto, beatrizId, 'auto', 'Fidelidade', 'FID-AUTO-2025-10445', 'Beatriz Lopes', '2025-01-01', '2026-01-01', 49.00, 'active', '54-NP-02', 'Opel', 'Astra', 2022, autoCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.beatrizHealth, beatrizId, 'health', 'Fidelidade', 'FID-SAU-2025-10445', 'Beatriz Lopes', '2025-01-01', '2026-01-01', 58.00, 'active', healthCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,plate,vehicle_make,vehicle_model,vehicle_year,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.fernandoAuto, fernandoId, 'auto', 'Fidelidade', 'FID-AUTO-2024-77823', 'Fernando Dias', '2024-05-01', '2026-05-01', 53.00, 'active', '76-WX-30', 'Nissan', 'Qashqai', 2023, autoCoverages);
db.prepare(`INSERT INTO policies (id,user_id,type,insurer,policy_number,holder_name,start_date,end_date,premium_monthly,status,address,coverages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
  p.fernandoHome, fernandoId, 'home', 'Fidelidade', 'FID-HAB-2024-77823', 'Fernando Dias', '2024-05-01', '2026-05-01', 33.00, 'active', 'Av. António Augusto Aguiar 120, Lisboa', homeCoverages);

/* ── Helpers ── */
const insertClaim = db.prepare(`INSERT INTO claims (id,user_id,policy_id,type,status,title,description,incident_date,incident_location,ai_analysis,is_covered,coverage_reason,estimated_amount,approved_amount,expert_name,expert_phone,photos,fraud_score,fraud_factors,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const insertEvent = db.prepare(`INSERT INTO claim_events (id,claim_id,status,title,description,created_at) VALUES (?,?,?,?,?,?)`);
const insertMsg   = db.prepare(`INSERT INTO claim_messages (id,claim_id,role,text,created_at) VALUES (?,?,?,?,?)`);

const TYPE_TITLES: Record<string, string> = {
  collision: 'Colisão / Acidente de viação', theft: 'Furto e roubo', fire: 'Incêndio',
  flood: 'Inundação / Danos por água', glass: 'Quebra de vidros', consultation: 'Consulta médica',
  surgery: 'Cirurgia / Internamento', liability: 'Responsabilidade civil', exams: 'Análises e exames',
  dental: 'Tratamento dentário', roadside: 'Assistência em viagem', other: 'Sinistro',
};

function makeClaim(opts: {
  userId: string; policyId: string; type: string; status: string;
  title: string; description: string; incidentDate: string; incidentLocation?: string;
  estimatedAmount: number; approvedAmount?: number;
  expertName?: string; expertPhone?: string;
  photos?: string[]; isCovered?: boolean; policyStartDate: string;
  previousClaimsCount?: number; createdAt: string;
}) {
  const id    = uuid();
  const fraud = calculateFraudScore({
    description: opts.description, incidentDate: opts.incidentDate,
    submittedAt: opts.createdAt, estimatedAmount: opts.estimatedAmount,
    incidentType: opts.type,
    severity: opts.estimatedAmount > 5000 ? 'high' : opts.estimatedAmount > 1500 ? 'medium' : 'low',
    policyStartDate: opts.policyStartDate, previousClaimsCount: opts.previousClaimsCount ?? 0,
    hasLocation: !!opts.incidentLocation, hasPhotos: (opts.photos ?? []).length > 0,
  });
  const ai = JSON.stringify({
    incidentType: opts.type,
    severity: opts.estimatedAmount > 5000 ? 'high' : 'medium',
    estimatedAmount: opts.estimatedAmount, confidence: 0.89,
    suggestedTitle: TYPE_TITLES[opts.type] ?? 'Sinistro',
    location: opts.incidentLocation ?? null, damageItems: [], involvedParties: [],
  });
  insertClaim.run(
    id, opts.userId, opts.policyId, opts.type, opts.status,
    opts.title, opts.description, opts.incidentDate, opts.incidentLocation ?? null,
    ai, opts.isCovered !== false ? 1 : 0,
    opts.isCovered !== false ? 'Coberto pela apólice' : 'Fora da cobertura',
    opts.estimatedAmount, opts.approvedAmount ?? null,
    opts.expertName ?? null, opts.expertPhone ?? null,
    JSON.stringify(opts.photos ?? []),
    fraud.score, JSON.stringify(fraud.factors),
    opts.createdAt, opts.createdAt,
  );
  return { id, fraud };
}

function addEvents(claimId: string, status: string, baseDate: string) {
  const d = new Date(baseDate);
  const advance = (h: number) => { d.setHours(d.getHours() + h); return new Date(d).toISOString(); };
  insertEvent.run(uuid(), claimId, 'submitted',      'Participação submetida',   'Participação recebida e registada.', advance(0));
  if (['under_review','expert_assigned','approved','paid','rejected'].includes(status))
    insertEvent.run(uuid(), claimId, 'under_review',   'Em análise',               'A participação está a ser analisada.', advance(20));
  if (['expert_assigned','approved','paid'].includes(status))
    insertEvent.run(uuid(), claimId, 'expert_assigned','Perito atribuído',          'Perito designado ao processo.', advance(24));
  if (['approved','paid'].includes(status))
    insertEvent.run(uuid(), claimId, 'approved',       'Sinistro aprovado',         'Indemnização aprovada.', advance(48));
  if (status === 'paid')
    insertEvent.run(uuid(), claimId, 'paid',           'Pagamento efetuado',        'Transferência realizada para o seu IBAN.', advance(24));
  if (status === 'rejected')
    insertEvent.run(uuid(), claimId, 'rejected',       'Sinistro rejeitado',        'Participação não aprovada após análise.', advance(24));
}

/* ════════════════════════════════════════════════════
   SINISTROS — NOVEMBRO 2025
════════════════════════════════════════════════════ */

const r1 = makeClaim({ userId: ruiId, policyId: p.ruiAuto, type: 'collision', status: 'paid',
  title: 'Colisão traseira na IC19', description: 'Colisão traseira na IC19 sentido Lisboa. Estava parado no semáforo quando um Ford Fiesta me embateu pela retaguarda. Para-choques e capô traseiro com danos. Trocámos dados e chamámos a GNR. Auto de acidente elaborado.', incidentDate: '2025-11-05T09:00:00Z', incidentLocation: 'IC19, km 8, Amadora', estimatedAmount: 1850, approvedAmount: 1700, photos: ['Para-choques traseiro', 'Auto GNR'], expertName: 'Eng. António Ferreira', expertPhone: '+351 210 234 567', policyStartDate: '2023-04-01', previousClaimsCount: 0, createdAt: '2025-11-05T10:00:00Z' });
addEvents(r1.id, 'paid', '2025-11-05T10:00:00Z');

const r2 = makeClaim({ userId: miguelId, policyId: p.miguelAuto, type: 'glass', status: 'paid',
  title: 'Quebra do para-brisas na A1', description: 'Pedra projetada por caminhão de carga na A1 fez estilhaçar o para-brisas do lado do condutor. Pedi assistência em viagem e fui a oficina autorizada para substituição.', incidentDate: '2025-11-12T14:30:00Z', incidentLocation: 'A1, km 32, Loures', estimatedAmount: 620, approvedAmount: 620, photos: ['Para-brisas partido'], policyStartDate: '2022-07-01', previousClaimsCount: 0, createdAt: '2025-11-12T15:00:00Z' });
addEvents(r2.id, 'paid', '2025-11-12T15:00:00Z');

const r3 = makeClaim({ userId: sofiaId, policyId: p.sofiaHealth, type: 'consultation', status: 'paid',
  title: 'Consulta de cardiologia', description: 'Consulta de especialidade de cardiologia por palpitações recorrentes. ECG e holter de 24h realizados. Médico não identificou patologia grave mas recomendou controlo regular.', incidentDate: '2025-11-18T11:00:00Z', incidentLocation: 'Hospital da Luz, Lisboa', estimatedAmount: 120, approvedAmount: 110, photos: ['Fatura consulta'], policyStartDate: '2024-02-01', previousClaimsCount: 0, createdAt: '2025-11-18T12:00:00Z' });
addEvents(r3.id, 'paid', '2025-11-18T12:00:00Z');

const r4 = makeClaim({ userId: pauloId, policyId: p.pauloAuto, type: 'roadside', status: 'paid',
  title: 'Assistência em viagem – avaria', description: 'Avaria na estrada por rebentamento do pneu traseiro. Pneu suplente sem pressão. Solicitar assistência em viagem para reboque até oficina e viatura de substituição por 1 dia.', incidentDate: '2025-11-22T18:00:00Z', incidentLocation: 'A2, km 14, Almada', estimatedAmount: 280, approvedAmount: 280, policyStartDate: '2023-06-01', previousClaimsCount: 0, createdAt: '2025-11-22T18:30:00Z' });
addEvents(r4.id, 'paid', '2025-11-22T18:30:00Z');

const r5 = makeClaim({ userId: inesId, policyId: p.inesHome, type: 'theft', status: 'approved',
  title: 'Furto com arrombamento', description: 'Arrombamento da porta de entrada durante ausência. Furtados: computador portátil, tablet, câmara fotográfica, relógio e joias. Queixa apresentada na PSP e relatório de ocorrência disponível. Porta partida necessita substituição.', incidentDate: '2025-11-28T14:00:00Z', incidentLocation: 'Tv. do Carmo 3, Porto', estimatedAmount: 4200, approvedAmount: 3800, photos: ['Porta arrombada', 'Auto PSP', 'Lista de bens'], policyStartDate: '2021-11-01', previousClaimsCount: 0, createdAt: '2025-11-28T17:00:00Z' });
addEvents(r5.id, 'approved', '2025-11-28T17:00:00Z');

/* ════════════════════════════════════════════════════
   SINISTROS — DEZEMBRO 2025
════════════════════════════════════════════════════ */

// João – colisão
const c1 = makeClaim({ userId: joaoId, policyId: p.joaoAuto, type: 'collision', status: 'approved',
  title: 'Colisão traseira na A2', description: 'Estava parado no trânsito na A2 quando um veículo me embateu pela retaguarda. Danos visíveis no para-choques traseiro e na mala do carro. O outro condutor assumiu a culpa e trocámos dados. Chamei a GNR que elaborou auto de ocorrência.', incidentDate: '2025-12-10T09:30:00Z', incidentLocation: 'A2, km 34, Setúbal', estimatedAmount: 1240, approvedAmount: 1100, expertName: 'Eng. António Ferreira', expertPhone: '+351 210 234 567', photos: ['Para-choques traseiro', 'Auto de ocorrência'], policyStartDate: '2022-01-15', previousClaimsCount: 0, createdAt: '2025-12-10T09:35:00Z' });
addEvents(c1.id, 'approved', '2025-12-10T09:35:00Z');

const d1 = makeClaim({ userId: fernandoId, policyId: p.fernandoAuto, type: 'collision', status: 'paid',
  title: 'Acidente com colisão lateral', description: 'Colisão lateral na Rotunda do Relógio em Lisboa. O outro condutor invadiu a minha faixa ao sair da rotunda. Airbag lateral disparou. Danos na porta do condutor e friso lateral. Testemunha presente. Auto de acidente com GNR.', incidentDate: '2025-12-03T08:30:00Z', incidentLocation: 'Rotunda do Relógio, Lisboa', estimatedAmount: 3100, approvedAmount: 2900, photos: ['Porta do condutor', 'Friso', 'Auto acidente'], expertName: 'Eng. Carlos Pinto', expertPhone: '+351 210 345 678', policyStartDate: '2024-05-01', previousClaimsCount: 0, createdAt: '2025-12-03T09:00:00Z' });
addEvents(d1.id, 'paid', '2025-12-03T09:00:00Z');

const d2 = makeClaim({ userId: beatrizId, policyId: p.beatrizHealth, type: 'surgery', status: 'approved',
  title: 'Cirurgia ao apêndice', description: 'Internamento de urgência por apendicite aguda. Cirurgia laparoscópica realizada com sucesso no Hospital de Santa Maria. 4 dias de internamento. Alta clínica com prescrição de antibiótico.', incidentDate: '2025-12-08T22:00:00Z', incidentLocation: 'Hospital de Santa Maria, Lisboa', estimatedAmount: 5200, approvedAmount: 5200, photos: ['Relatório cirúrgico', 'Fatura hospital'], policyStartDate: '2025-01-01', previousClaimsCount: 0, createdAt: '2025-12-09T11:00:00Z' });
addEvents(d2.id, 'approved', '2025-12-09T11:00:00Z');

const d3 = makeClaim({ userId: sofiaId, policyId: p.sofiaAuto, type: 'theft', status: 'under_review',
  title: 'Furto do veículo', description: 'O meu veículo foi furtado do parque de estacionamento do centro comercial. Parquei às 14h e quando regressei às 18h o carro já não estava. Apresentei queixa imediata na PSP e tenho o número de participação. Câmeras do parque confirmam que o veículo saiu às 16h40.', incidentDate: '2025-12-14T16:40:00Z', incidentLocation: 'Parque de Estacionamento Dolce Vita, Lisboa', estimatedAmount: 18000, photos: ['Participação PSP', 'Confirmação câmera'], policyStartDate: '2024-02-01', previousClaimsCount: 0, createdAt: '2025-12-14T18:00:00Z' });
addEvents(d3.id, 'under_review', '2025-12-14T18:00:00Z');

// Ana – HIGH FRAUD
const c7 = makeClaim({ userId: anaId, policyId: p.anaAuto, type: 'collision', status: 'under_review',
  title: 'Colisão / Acidente de viação', description: 'Bati. Danos.', incidentDate: '2025-12-20T02:30:00Z', estimatedAmount: 12000, policyStartDate: '2024-09-01', previousClaimsCount: 3, createdAt: '2025-12-20T02:45:00Z' });
addEvents(c7.id, 'under_review', '2025-12-20T02:45:00Z');

const c8 = makeClaim({ userId: anaId, policyId: p.anaHome, type: 'theft', status: 'submitted',
  title: 'Furto e roubo', description: 'Roubaram tudo. Não sei o que aconteceu talvez tenham entrado pela janela. Perda total de todos os bens.', incidentDate: '2025-12-28T23:00:00Z', estimatedAmount: 8000, policyStartDate: '2020-03-01', previousClaimsCount: 3, createdAt: '2025-12-28T23:10:00Z' });
addEvents(c8.id, 'submitted', '2025-12-28T23:10:00Z');

const d4 = makeClaim({ userId: ruiId, policyId: p.ruiHome, type: 'flood', status: 'expert_assigned',
  title: 'Inundação por rotura de canalização', description: 'Rotura de tubagem de água quente na casa de banho principal causou inundação no piso térreo. Soalho flutuante da sala e corredor completamente destruído. Danos em móveis e instalações elétricas. Técnico de canalização confirmou a origem da avaria em relatório escrito.', incidentDate: '2025-12-17T07:00:00Z', incidentLocation: 'Rua de Entrecampos 7, Lisboa', estimatedAmount: 9800, expertName: 'Arq. Sofia Lopes', expertPhone: '+351 210 567 890', photos: ['Sala afetada', 'Rotura cano', 'Relatório técnico'], policyStartDate: '2023-04-01', previousClaimsCount: 0, createdAt: '2025-12-17T08:30:00Z' });
addEvents(d4.id, 'expert_assigned', '2025-12-17T08:30:00Z');

/* ════════════════════════════════════════════════════
   SINISTROS — JANEIRO 2026
════════════════════════════════════════════════════ */

const e1 = makeClaim({ userId: miguelId, policyId: p.miguelAuto, type: 'collision', status: 'paid',
  title: 'Colisão em parque de estacionamento', description: 'Ao fazer manobra de estacionamento num parque coberto, outro veículo que saía da vaga embateu na frente do meu carro. Danos no para-choques e farol esquerdo. Condutor identificado e seguros notificados.', incidentDate: '2026-01-07T11:00:00Z', incidentLocation: 'Parque CC Colombo, Lisboa', estimatedAmount: 980, approvedAmount: 900, photos: ['Frente do carro', 'Farol', 'Auto de ocorrência'], policyStartDate: '2022-07-01', previousClaimsCount: 1, createdAt: '2026-01-07T12:00:00Z' });
addEvents(e1.id, 'paid', '2026-01-07T12:00:00Z');

const e2 = makeClaim({ userId: inesId, policyId: p.inesHealth, type: 'hospital', status: 'paid',
  title: 'Internamento por pneumonia', description: 'Internamento de 5 dias por pneumonia bacteriana bilateral. Tratamento com antibioterapia endovenosa e suporte de oxigénio. Alta clínica com medicação prescrita e repouso de 2 semanas.', incidentDate: '2026-01-09T15:00:00Z', incidentLocation: 'Hospital de S. João, Porto', estimatedAmount: 3800, approvedAmount: 3800, photos: ['Relatório de alta', 'Fatura'], policyStartDate: '2023-01-01', previousClaimsCount: 0, createdAt: '2026-01-09T17:00:00Z' });
addEvents(e2.id, 'paid', '2026-01-09T17:00:00Z');

const e3 = makeClaim({ userId: pauloId, policyId: p.pauloHome, type: 'fire', status: 'approved',
  title: 'Incêndio na cozinha', description: 'Incêndio na cozinha originado por descuido no fogão enquanto estava na sala. Fogo rapidamente controlado mas causou danos totais nos armários da cozinha, bancada e dois eletrodomésticos. Bombeiros no local elaboraram relatório.', incidentDate: '2026-01-15T20:30:00Z', incidentLocation: 'Rua do Ouro 55, Lisboa', estimatedAmount: 6500, approvedAmount: 6000, photos: ['Cozinha danificada', 'Relatório bombeiros', 'Orçamento reparação'], expertName: 'Perito João Nunes', expertPhone: '+351 218 765 432', policyStartDate: '2023-06-01', previousClaimsCount: 0, createdAt: '2026-01-15T21:00:00Z' });
addEvents(e3.id, 'approved', '2026-01-15T21:00:00Z');

const e4 = makeClaim({ userId: fernandoId, policyId: p.fernandoAuto, type: 'glass', status: 'paid',
  title: 'Vidro da janela traseira partido', description: 'Vidro da janela traseira partido por vandalismo enquanto o carro estava estacionado na via pública. Apresentei participação à PSP. Substituição realizada em oficina autorizada.', incidentDate: '2026-01-19T03:00:00Z', incidentLocation: 'Rua Almirante Reis, Lisboa', estimatedAmount: 480, approvedAmount: 480, photos: ['Janela partida', 'Auto PSP'], policyStartDate: '2024-05-01', previousClaimsCount: 0, createdAt: '2026-01-19T09:00:00Z' });
addEvents(e4.id, 'paid', '2026-01-19T09:00:00Z');

const e5 = makeClaim({ userId: beatrizId, policyId: p.beatrizAuto, type: 'collision', status: 'under_review',
  title: 'Colisão traseira em hora de ponta', description: 'Colisão traseira na Avenida de Ceuta durante engarrafamento matinal. O veículo atrás não travou a tempo e embateu no meu carro. Para-choques traseiro e gancho de reboque com danos. Ambos os seguros foram notificados. GNR no local.', incidentDate: '2026-01-22T08:30:00Z', incidentLocation: 'Av. de Ceuta, Lisboa', estimatedAmount: 1600, photos: ['Para-choques', 'Gancho reboque', 'Auto GNR'], policyStartDate: '2025-01-01', previousClaimsCount: 0, createdAt: '2026-01-22T09:00:00Z' });
addEvents(e5.id, 'under_review', '2026-01-22T09:00:00Z');

// FRAUD HIGH
const e6 = makeClaim({ userId: anaId, policyId: p.anaAuto, type: 'theft', status: 'rejected',
  title: 'Furto e roubo', description: 'Carro roubado. Não sei quando. Estava no trabalho acho que foi à tarde.', incidentDate: '2026-01-25T14:00:00Z', estimatedAmount: 22000, policyStartDate: '2024-09-01', previousClaimsCount: 4, isCovered: false, createdAt: '2026-01-25T16:00:00Z' });
addEvents(e6.id, 'rejected', '2026-01-25T16:00:00Z');

const e7 = makeClaim({ userId: ruiId, policyId: p.ruiAuto, type: 'liability', status: 'approved',
  title: 'Danos a terceiros em parque', description: 'Ao efetuar manobra em parque de estacionamento embati na lateral de um veículo estacionado. Proprietário presente. Acordámos participação às seguradoras. Danos limitados ao para-lamas traseiro do veículo visado.', incidentDate: '2026-01-28T17:00:00Z', incidentLocation: 'Parque das Nações, Lisboa', estimatedAmount: 820, approvedAmount: 750, photos: ['Para-lamas danificado', 'Viaturas envolvidas'], policyStartDate: '2023-04-01', previousClaimsCount: 1, createdAt: '2026-01-28T17:30:00Z' });
addEvents(e7.id, 'approved', '2026-01-28T17:30:00Z');

/* ════════════════════════════════════════════════════
   SINISTROS — FEVEREIRO 2026
════════════════════════════════════════════════════ */

const f1 = makeClaim({ userId: sofiaId, policyId: p.sofiaHealth, type: 'exams', status: 'paid',
  title: 'Ressonância magnética e análises', description: 'Conjunto de exames complementares de diagnóstico: ressonância magnética lombar, análises clínicas completas e ecografia abdominal. Prescrição do médico de família por dores lombares persistentes.', incidentDate: '2026-02-04T09:00:00Z', incidentLocation: 'Clínica Imagiologia Lisboa', estimatedAmount: 340, approvedAmount: 320, photos: ['Prescrição médica', 'Fatura'], policyStartDate: '2024-02-01', previousClaimsCount: 1, createdAt: '2026-02-04T10:00:00Z' });
addEvents(f1.id, 'paid', '2026-02-04T10:00:00Z');

const f2 = makeClaim({ userId: pauloId, policyId: p.pauloAuto, type: 'collision', status: 'paid',
  title: 'Colisão lateral na rotunda', description: 'Acidente de viação numa rotunda perto de casa. Dois veículos disputaram o mesmo espaço simultaneamente. Danos na porta traseira do lado esquerdo. Relatório da GNR elaborado. Testemunha identificada.', incidentDate: '2026-02-10T16:00:00Z', incidentLocation: 'Rotunda do Marquês, Lisboa', estimatedAmount: 2200, approvedAmount: 2100, photos: ['Porta traseira', 'Auto GNR', 'Orçamento'], expertName: 'Eng. Rui Teixeira', expertPhone: '+351 214 789 012', policyStartDate: '2023-06-01', previousClaimsCount: 1, createdAt: '2026-02-10T17:00:00Z' });
addEvents(f2.id, 'paid', '2026-02-10T17:00:00Z');

const f3 = makeClaim({ userId: inesId, policyId: p.inesHome, type: 'glass', status: 'paid',
  title: 'Quebra de vidros por temporal', description: 'Temporal com granizo intenso destruiu dois vidros da varanda e um painel de estores exterior. Danos confirmados por empresa de reparação. Meteorologia confirma evento extremo na data.', incidentDate: '2026-02-16T19:00:00Z', incidentLocation: 'Tv. do Carmo 3, Porto', estimatedAmount: 650, approvedAmount: 650, photos: ['Varanda danificada', 'Estores'], policyStartDate: '2021-11-01', previousClaimsCount: 1, createdAt: '2026-02-16T20:00:00Z' });
addEvents(f3.id, 'paid', '2026-02-16T20:00:00Z');

const f4 = makeClaim({ userId: miguelId, policyId: p.miguelAuto, type: 'fire', status: 'expert_assigned',
  title: 'Incêndio por falha elétrica', description: 'Incêndio no compartimento do motor originado por curto-circuito no sistema de arranque. Fogo detetado ao arrancar o veículo de manhã. Bombeiros no local. Veículo com danos graves na zona frontal. Relatório pericial dos bombeiros anexo.', incidentDate: '2026-02-20T07:30:00Z', incidentLocation: 'Av. João XXI, Lisboa', estimatedAmount: 14000, expertName: 'Eng. Pedro Fonseca', expertPhone: '+351 219 234 567', photos: ['Motor destruído', 'Relatório bombeiros', 'Vistoria exterior'], policyStartDate: '2022-07-01', previousClaimsCount: 0, createdAt: '2026-02-20T08:30:00Z' });
addEvents(f4.id, 'expert_assigned', '2026-02-20T08:30:00Z');

const f5 = makeClaim({ userId: beatrizId, policyId: p.beatrizHealth, type: 'dental', status: 'approved',
  title: 'Implante dentário', description: 'Fratura de dente molar por acidente doméstico. Médico dentista indicou extração e implante. Tratamento realizado em clínica conveniada com a seguradora. Inclui extração, implante de titânio e coroa definitiva.', incidentDate: '2026-02-25T14:00:00Z', incidentLocation: 'Clínica Dental Sorria, Lisboa', estimatedAmount: 1400, approvedAmount: 1300, photos: ['Orçamento clínica', 'Relatório dentista'], policyStartDate: '2025-01-01', previousClaimsCount: 0, createdAt: '2026-02-25T15:00:00Z' });
addEvents(f5.id, 'approved', '2026-02-25T15:00:00Z');

// FRAUD MEDIUM
const f6 = makeClaim({ userId: fernandoId, policyId: p.fernandoAuto, type: 'theft', status: 'under_review',
  title: 'Furto de objetos do interior', description: 'Furto de objetos do interior do veículo. A janela foi partida. Levaram computador portátil, mala e documentos. Não sei exatamente quando aconteceu. Participei à PSP.', incidentDate: '2026-02-27T22:00:00Z', estimatedAmount: 3500, photos: ['Janela partida'], policyStartDate: '2024-05-01', previousClaimsCount: 0, createdAt: '2026-02-27T08:00:00Z' });
addEvents(f6.id, 'under_review', '2026-02-27T08:00:00Z');

/* ════════════════════════════════════════════════════
   SINISTROS — MARÇO 2026
════════════════════════════════════════════════════ */

const g1 = makeClaim({ userId: joaoId, policyId: p.joaoAuto, type: 'roadside', status: 'paid',
  title: 'Assistência em viagem – pneu', description: 'Furo de pneu traseiro direito na A8. Pneu suplente com válvula defeituosa. Solicitei assistência em viagem para substituição de pneu no local e reboque até à oficina para montagem de novo pneu.', incidentDate: '2026-03-03T10:00:00Z', incidentLocation: 'A8, km 18, Loures', estimatedAmount: 220, approvedAmount: 220, policyStartDate: '2022-01-15', previousClaimsCount: 1, createdAt: '2026-03-03T10:30:00Z' });
addEvents(g1.id, 'paid', '2026-03-03T10:30:00Z');

const g2 = makeClaim({ userId: ruiId, policyId: p.ruiAuto, type: 'collision', status: 'approved',
  title: 'Colisão com animal na estrada', description: 'Colisão com javali que atravessou a estrada nacional. Acidente ocorreu de noite, sem possibilidade de travar. Danos na frente do veículo, capô e para-brisas fissurado. GNR chamada ao local, relatório elaborado. Fotografia do animal no local.', incidentDate: '2026-03-07T23:00:00Z', incidentLocation: 'EN10, km 45, Palmela', estimatedAmount: 4800, approvedAmount: 4400, photos: ['Frente do carro', 'Auto GNR', 'Capô danificado'], expertName: 'Eng. António Ferreira', expertPhone: '+351 210 234 567', policyStartDate: '2023-04-01', previousClaimsCount: 1, createdAt: '2026-03-07T23:30:00Z' });
addEvents(g2.id, 'approved', '2026-03-07T23:30:00Z');

const g3 = makeClaim({ userId: sofiaId, policyId: p.sofiaHealth, type: 'surgery', status: 'paid',
  title: 'Cirurgia ao joelho', description: 'Artroscopia ao joelho esquerdo após rotura do ligamento cruzado anterior durante prática desportiva. Cirurgia realizada na Clínica Ortopédica de Lisboa. Internamento de 1 dia. Fisioterapia prescrita por 3 meses.', incidentDate: '2026-03-10T08:00:00Z', incidentLocation: 'Clínica Ortopédica de Lisboa', estimatedAmount: 6800, approvedAmount: 6800, photos: ['Relatório cirúrgico', 'Fatura'], policyStartDate: '2024-02-01', previousClaimsCount: 2, createdAt: '2026-03-10T11:00:00Z' });
addEvents(g3.id, 'paid', '2026-03-10T11:00:00Z');

const g4 = makeClaim({ userId: inesId, policyId: p.inesHealth, type: 'consultation', status: 'paid',
  title: 'Consulta de neurologia', description: 'Consulta de neurologia por cefaleias persistentes. Solicitada TC cranioencefálica e análises específicas. Médico excluiu patologia grave. Tratamento sintomático prescrito.', incidentDate: '2026-03-14T15:30:00Z', incidentLocation: 'Hospital Privado do Norte, Porto', estimatedAmount: 140, approvedAmount: 130, photos: ['Fatura consulta'], policyStartDate: '2023-01-01', previousClaimsCount: 2, createdAt: '2026-03-14T16:00:00Z' });
addEvents(g4.id, 'paid', '2026-03-14T16:00:00Z');

const g5 = makeClaim({ userId: pauloId, policyId: p.pauloHome, type: 'flood', status: 'expert_assigned',
  title: 'Infiltrações após chuvas', description: 'Infiltrações no teto da sala e quarto principal após chuvas intensas. Manchas de humidade e descasque da pintura em 40m² de teto. Empresa de construção avaliou necessidade de reparação da impermeabilização da cobertura e pintura interior.', incidentDate: '2026-03-19T09:00:00Z', incidentLocation: 'Rua do Ouro 55, Lisboa', estimatedAmount: 5500, expertName: 'Arq. Marta Costa', expertPhone: '+351 213 456 789', photos: ['Teto afetado', 'Manchas humidade', 'Orçamento'], policyStartDate: '2023-06-01', previousClaimsCount: 0, createdAt: '2026-03-19T10:00:00Z' });
addEvents(g5.id, 'expert_assigned', '2026-03-19T10:00:00Z');

const g6 = makeClaim({ userId: fernandoId, policyId: p.fernandoAuto, type: 'collision', status: 'under_review',
  title: 'Colisão em cruzamento', description: 'Acidente de viação num cruzamento sem sinalização. Outro veículo não cedeu a passagem. Colisão na frente direita. Danos no para-choque, farol e guarda-lamas. Testemunhas identificadas. Auto de acidente da GNR.', incidentDate: '2026-03-22T14:00:00Z', incidentLocation: 'Rua de Campo de Ourique, Lisboa', estimatedAmount: 3200, photos: ['Frente direita', 'Auto GNR'], policyStartDate: '2024-05-01', previousClaimsCount: 1, createdAt: '2026-03-22T14:45:00Z' });
addEvents(g6.id, 'under_review', '2026-03-22T14:45:00Z');

// CRITICAL FRAUD
const g7 = makeClaim({ userId: anaId, policyId: p.anaHome, type: 'flood', status: 'submitted',
  title: 'Inundação / Danos por água', description: 'Inundação. Não sei a causa. Talvez chuva.', incidentDate: '2026-03-25T04:00:00Z', estimatedAmount: 12000, policyStartDate: '2020-03-01', previousClaimsCount: 4, createdAt: '2026-03-25T04:15:00Z' });
addEvents(g7.id, 'submitted', '2026-03-25T04:15:00Z');

const g8 = makeClaim({ userId: miguelId, policyId: p.miguelAuto, type: 'collision', status: 'approved',
  title: 'Embate em obstáculo na estrada', description: 'Colisão com objeto caído na via (máquina de lavar) durante a noite na EN6. Danos no para-choque frontal, radiador e capô. Pedi assistência em viagem. Fotos do objeto na via e do veículo tiradas no local com geolocalização.', incidentDate: '2026-03-28T22:00:00Z', incidentLocation: 'EN6, km 12, Oeiras', estimatedAmount: 3700, approvedAmount: 3500, photos: ['Frente do carro', 'Objeto na via', 'Vistoria'], policyStartDate: '2022-07-01', previousClaimsCount: 1, createdAt: '2026-03-28T22:30:00Z' });
addEvents(g8.id, 'approved', '2026-03-28T22:30:00Z');

const g9 = makeClaim({ userId: beatrizId, policyId: p.beatrizAuto, type: 'glass', status: 'paid',
  title: 'Para-brisas partido por granizo', description: 'Granizo intenso durante tempestade no parque de estacionamento ao ar livre partiu o para-brisas e amolgou o capô. Meteorologia confirma evento de granizo na zona nessa data. Substituição em oficina autorizada.', incidentDate: '2026-03-30T15:00:00Z', incidentLocation: 'Parque Estacionamento Saldanha, Lisboa', estimatedAmount: 740, approvedAmount: 740, photos: ['Para-brisas', 'Capô amolgado'], policyStartDate: '2025-01-01', previousClaimsCount: 1, createdAt: '2026-03-30T16:00:00Z' });
addEvents(g9.id, 'paid', '2026-03-30T16:00:00Z');

/* ════════════════════════════════════════════════════
   SINISTROS — ABRIL 2026 (mês atual)
════════════════════════════════════════════════════ */

const h1 = makeClaim({ userId: ruiId, policyId: p.ruiHome, type: 'theft', status: 'submitted',
  title: 'Furto com arrombamento', description: 'Regresso a casa e verifiquei que a porta da cave estava arrombada. Furtados TV, consola de jogos, relógio e mochila com equipamento de caminhada. Queixa apresentada na PSP às 21h. Porta da cave necessita substituição completa.', incidentDate: '2026-04-01T19:00:00Z', incidentLocation: 'Rua de Entrecampos 7, Lisboa', estimatedAmount: 2800, photos: ['Porta arrombada', 'Auto PSP'], policyStartDate: '2023-04-01', previousClaimsCount: 1, createdAt: '2026-04-01T21:00:00Z' });
addEvents(h1.id, 'submitted', '2026-04-01T21:00:00Z');

const h2 = makeClaim({ userId: sofiaId, policyId: p.sofiaAuto, type: 'collision', status: 'under_review',
  title: 'Colisão traseira no IC2', description: 'Colisão traseira no IC2 perto de Loures. Estava a circular a velocidade moderada quando o veículo atrás embateu. Para-choques traseiro destruído, tampa da mala dobrada. GNR no local, auto elaborado. Apresentei queixa ao seguro do outro condutor.', incidentDate: '2026-04-02T17:30:00Z', incidentLocation: 'IC2, km 4, Loures', estimatedAmount: 2100, photos: ['Para-choques', 'Tampa mala', 'Auto GNR'], policyStartDate: '2024-02-01', previousClaimsCount: 1, createdAt: '2026-04-02T18:00:00Z' });
addEvents(h2.id, 'under_review', '2026-04-02T18:00:00Z');

const h3 = makeClaim({ userId: inesId, policyId: p.inesHealth, type: 'exams', status: 'submitted',
  title: 'Análises e TAC torácica', description: 'Exames complementares de diagnóstico: análises clínicas, TAC torácica e espirometria. Prescritos por pneumologista após episódio de tosse persistente. Realizados em clínica privada conveniada.', incidentDate: '2026-04-03T09:30:00Z', incidentLocation: 'Clínica de Pneumologia do Porto', estimatedAmount: 480, photos: ['Prescrição médica', 'Faturas'], policyStartDate: '2023-01-01', previousClaimsCount: 2, createdAt: '2026-04-03T10:00:00Z' });
addEvents(h3.id, 'submitted', '2026-04-03T10:00:00Z');

const h4 = makeClaim({ userId: pauloId, policyId: p.pauloAuto, type: 'glass', status: 'submitted',
  title: 'Vidro partido por vandalismo', description: 'Vidro da janela traseira partido durante a noite enquanto o veículo estava estacionado na rua. Encontrei o carro de manhã com o vidro partido e sem sinais de furto. Apresentei participação à PSP.', incidentDate: '2026-04-04T03:00:00Z', incidentLocation: 'Rua do Ouro 55, Lisboa', estimatedAmount: 420, photos: ['Janela partida', 'Auto PSP'], policyStartDate: '2023-06-01', previousClaimsCount: 2, createdAt: '2026-04-04T08:00:00Z' });
addEvents(h4.id, 'submitted', '2026-04-04T08:00:00Z');

const h5 = makeClaim({ userId: fernandoId, policyId: p.fernandoHome, type: 'fire', status: 'under_review',
  title: 'Incêndio em terraço', description: 'Incêndio no terraço da habitação originado por vela acesa junto a elementos decorativos. Fogo rapidamente extinto com extintor doméstico mas causou danos no piso do terraço, proteção solar e duas cadeiras de exterior. Bombeiros chamados por precaução.', incidentDate: '2026-04-05T21:00:00Z', incidentLocation: 'Av. António Augusto Aguiar 120, Lisboa', estimatedAmount: 1800, photos: ['Terraço danificado', 'Relatório bombeiros'], policyStartDate: '2024-05-01', previousClaimsCount: 0, createdAt: '2026-04-05T22:00:00Z' });
addEvents(h5.id, 'under_review', '2026-04-05T22:00:00Z');

const h6 = makeClaim({ userId: beatrizId, policyId: p.beatrizHealth, type: 'consultation', status: 'submitted',
  title: 'Consulta de dermatologia', description: 'Consulta de dermatologia por aparecimento súbito de lesões cutâneas no dorso e braços. Médico realizou biópsia e prescreveu tratamento tópico. Resultado da biópsia aguardado em 2 semanas.', incidentDate: '2026-04-06T11:00:00Z', incidentLocation: 'CUF Infante Santo, Lisboa', estimatedAmount: 95, photos: ['Fatura consulta'], policyStartDate: '2025-01-01', previousClaimsCount: 1, createdAt: '2026-04-06T11:30:00Z' });
addEvents(h6.id, 'submitted', '2026-04-06T11:30:00Z');

// SLA ALERT — over 7 days pending (older submitted/under_review)
const sla1 = makeClaim({ userId: miguelId, policyId: p.miguelAuto, type: 'liability', status: 'under_review',
  title: 'Danos em propriedade privada', description: 'Ao estacionar no estreito acesso de um condomínio privado, o espelho do veículo embateu numa coluna de granito da entrada, causando danos na coluna e no espelho. O proprietário do condomínio exige reparação.', incidentDate: '2026-03-25T16:00:00Z', incidentLocation: 'Rua das Amoreiras, Lisboa', estimatedAmount: 1100, policyStartDate: '2022-07-01', previousClaimsCount: 1, createdAt: '2026-03-26T10:00:00Z' });
addEvents(sla1.id, 'under_review', '2026-03-26T10:00:00Z');

const sla2 = makeClaim({ userId: inesId, policyId: p.inesHome, type: 'flood', status: 'submitted',
  title: 'Danos por água no teto', description: 'Infiltrações no teto do quarto por avaria na canalização do apartamento do piso superior. O vizinho de cima confirmou rotura de tubo de abastecimento. Manchas de humidade em 15m² de teto e parede adjacente. Relatório do técnico de canalização disponível.', incidentDate: '2026-03-27T08:00:00Z', incidentLocation: 'Tv. do Carmo 3, Porto', estimatedAmount: 2200, photos: ['Teto afetado', 'Relatório canalização'], policyStartDate: '2021-11-01', previousClaimsCount: 1, createdAt: '2026-03-27T09:00:00Z' });
addEvents(sla2.id, 'submitted', '2026-03-27T09:00:00Z');

/* ════════════════════════════════════════════════════
   MENSAGENS
════════════════════════════════════════════════════ */
insertMsg.run(uuid(), c1.id, 'system',   'Participação registada com sucesso. Nº CF-2025-12-001', '2025-12-10T09:35:00Z');
insertMsg.run(uuid(), c1.id, 'adjuster', 'Bom dia, Sr. Silva. Os danos descritos estão cobertos pela apólice. O perito entrará em contacto nas próximas 24h.', '2025-12-12T10:15:00Z');
insertMsg.run(uuid(), c1.id, 'customer', 'Obrigado. Quando recebo o pagamento?', '2025-12-12T11:00:00Z');
insertMsg.run(uuid(), c1.id, 'adjuster', 'Após aprovação o pagamento é efetuado em 3–5 dias úteis para o seu IBAN.', '2025-12-12T11:30:00Z');

insertMsg.run(uuid(), d3.id, 'system',   'Participação de furto registada. Participação à PSP obrigatória.', '2025-12-14T18:00:00Z');
insertMsg.run(uuid(), d3.id, 'adjuster', 'Sra. Rodrigues, recebemos a sua participação. Confirmamos que o número de ocorrência PSP é válido. Iremos contactar o parque para obter as imagens das câmeras de videovigilância.', '2025-12-16T09:00:00Z');

insertMsg.run(uuid(), g5.id, 'adjuster', 'Bom dia, Sr. Marques. A perita Arq. Marta Costa irá contactá-lo em breve para agendar vistoria ao imóvel.', '2026-03-20T10:00:00Z');
insertMsg.run(uuid(), g5.id, 'customer', 'Obrigado. Fico a aguardar.', '2026-03-20T11:30:00Z');

insertMsg.run(uuid(), h2.id, 'system',   'Participação registada. Nº CF-2026-04-002', '2026-04-02T18:00:00Z');
insertMsg.run(uuid(), h2.id, 'adjuster', 'Sra. Rodrigues, recebemos a sua participação. Necessitamos de orçamento de reparação de oficina autorizada para prosseguir com a análise.', '2026-04-03T09:00:00Z');

console.log('✅ Seed concluído com sucesso');
console.log('   Utilizadores: joao | maria | pedro | ana | carlos | rui | sofia | miguel | ines | paulo | beatriz | fernando @demo.pt');
console.log('   Password: Demo1234!');
console.log('   Apólices: 22 (14 Fidelidade) | Sinistros: ~55 (44 Fidelidade)');
console.log('   Token seguradora: insurer-demo-2024');
