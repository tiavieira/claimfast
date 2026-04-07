export interface FraudResult {
  score: number;                        // 0–100
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: { label: string; impact: 'positive' | 'negative'; points: number }[];
}

interface FraudInput {
  description: string;
  incidentDate: string;        // ISO date string
  submittedAt: string;         // ISO datetime string
  estimatedAmount: number;
  incidentType: string;
  severity: string;
  policyStartDate: string;     // ISO date
  previousClaimsCount: number; // claims by same user in last 12 months
  hasLocation: boolean;
  hasPhotos: boolean;
}

const NIGHT_HOURS = [22, 23, 0, 1, 2, 3, 4, 5];

const VAGUE_KEYWORDS  = ['não sei', 'acho que', 'talvez', 'não tenho certeza', 'parece que', 'pode ser'];
const INFLATE_KEYWORDS = ['muito caro', 'tudo destruído', 'perda total', 'completamente', 'irreparável'];
const RUSH_KEYWORDS   = ['urgente', 'preciso já', 'imediatamente', 'o mais rápido'];

function daysBetween(a: string, b: string): number {
  return Math.abs((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function calculateFraudScore(input: FraudInput): FraudResult {
  const factors: FraudResult['factors'] = [];
  let score = 0;

  const lower = input.description.toLowerCase();
  const incidentHour = new Date(input.incidentDate).getHours();
  const daysSincePolicy = daysBetween(input.policyStartDate, input.incidentDate);
  const hoursToSubmit = daysBetween(input.incidentDate, input.submittedAt) * 24;
  const isWeekend = [0, 6].includes(new Date(input.incidentDate).getDay());
  const descWords = input.description.trim().split(/\s+/).length;
  const isRoundAmount = input.estimatedAmount % 500 === 0 && input.estimatedAmount > 0;

  // ── Risk indicators ──
  if (NIGHT_HOURS.includes(incidentHour)) {
    score += 12; factors.push({ label: 'Sinistro em horário nocturno', impact: 'negative', points: 12 });
  }
  if (isWeekend) {
    score += 5; factors.push({ label: 'Sinistro ao fim de semana', impact: 'negative', points: 5 });
  }
  if (daysSincePolicy < 90 && input.estimatedAmount > 3000) {
    score += 22; factors.push({ label: 'Apólice recente + montante elevado', impact: 'negative', points: 22 });
  } else if (daysSincePolicy < 180 && input.estimatedAmount > 5000) {
    score += 14; factors.push({ label: 'Apólice com < 6 meses', impact: 'negative', points: 14 });
  }
  if (input.previousClaimsCount >= 2) {
    const pts = Math.min(20, input.previousClaimsCount * 8);
    score += pts; factors.push({ label: `${input.previousClaimsCount} sinistros anteriores (12 meses)`, impact: 'negative', points: pts });
  }
  if (descWords < 15) {
    score += 18; factors.push({ label: 'Descrição muito curta / vaga', impact: 'negative', points: 18 });
  }
  const vagueMatches = VAGUE_KEYWORDS.filter(k => lower.includes(k)).length;
  if (vagueMatches > 0) {
    const pts = vagueMatches * 7;
    score += pts; factors.push({ label: 'Linguagem imprecisa na descrição', impact: 'negative', points: pts });
  }
  const inflateMatches = INFLATE_KEYWORDS.filter(k => lower.includes(k)).length;
  if (inflateMatches >= 2) {
    score += 10; factors.push({ label: 'Possível exagero dos danos', impact: 'negative', points: 10 });
  }
  if (isRoundAmount && input.estimatedAmount >= 1000) {
    score += 8; factors.push({ label: 'Valor estimado muito arredondado', impact: 'negative', points: 8 });
  }
  if (!input.hasLocation) {
    score += 8; factors.push({ label: 'Sem localização do sinistro', impact: 'negative', points: 8 });
  }
  if (hoursToSubmit < 0.5) {
    score += 6; factors.push({ label: 'Participação muito imediata', impact: 'negative', points: 6 });
  }
  if (input.severity === 'total_loss') {
    score += 10; factors.push({ label: 'Declaração de perda total', impact: 'negative', points: 10 });
  }

  // ── Trust indicators ──
  if (input.hasPhotos) {
    score -= 12; factors.push({ label: 'Evidências fotográficas fornecidas', impact: 'positive', points: 12 });
  }
  if (descWords >= 40) {
    score -= 8; factors.push({ label: 'Descrição detalhada e consistente', impact: 'positive', points: 8 });
  }
  if (daysSincePolicy > 365) {
    score -= 10; factors.push({ label: 'Apólice com mais de 1 ano', impact: 'positive', points: 10 });
  }
  if (input.previousClaimsCount === 0) {
    score -= 8; factors.push({ label: 'Sem sinistros anteriores', impact: 'positive', points: 8 });
  }
  if (input.hasLocation) {
    score -= 5; factors.push({ label: 'Localização fornecida', impact: 'positive', points: 5 });
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let level: FraudResult['level'] = 'low';
  if (finalScore >= 70)      level = 'critical';
  else if (finalScore >= 45) level = 'high';
  else if (finalScore >= 25) level = 'medium';

  // Sort: negatives first (most impactful), then positives
  factors.sort((a, b) => {
    if (a.impact !== b.impact) return a.impact === 'negative' ? -1 : 1;
    return b.points - a.points;
  });

  return { score: finalScore, level, factors };
}
