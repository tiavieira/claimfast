export interface ClaimAnalysis {
  incidentType: string;
  severity: 'low' | 'medium' | 'high' | 'total_loss';
  location: string | null;
  damageItems: string[];
  involvedParties: string[];
  confidence: number;
  suggestedTitle: string;
  estimatedAmount: number;
}

interface Rule {
  type: string;
  keywords: string[];
  baseEstimate: [number, number]; // [min, max]
}

const RULES: Rule[] = [
  {
    type: 'collision',
    keywords: ['colisão','colidiu','embateu','bateu','acidente','capotou','choque','batida','embate','raspou','riscou','amassou'],
    baseEstimate: [400, 5000],
  },
  {
    type: 'theft',
    keywords: ['roubado','roubo','furto','furtaram','levaram','desapareceu','assalto','arrombamento'],
    baseEstimate: [1000, 15000],
  },
  {
    type: 'fire',
    keywords: ['incêndio','fogo','queimou','ardeu','chamas','fumou','queimado'],
    baseEstimate: [2000, 20000],
  },
  {
    type: 'flood',
    keywords: ['inundação','água','cano','infiltração','chuva','cheias','molhou','humedeceu','vazamento'],
    baseEstimate: [500, 12000],
  },
  {
    type: 'glass',
    keywords: ['vidro','para-brisas','parabrisa','janela','partido','estilhaçou','lascou'],
    baseEstimate: [150, 900],
  },
  {
    type: 'consultation',
    keywords: ['consulta','médico','especialista','clínica','hospital','urgência','análises','exame'],
    baseEstimate: [50, 300],
  },
  {
    type: 'surgery',
    keywords: ['cirurgia','operação','internamento','operado','intervenção cirúrgica'],
    baseEstimate: [1500, 20000],
  },
  {
    type: 'liability',
    keywords: ['danos a terceiros','atropelei','bati noutro','danifiquei','estraguei propriedade'],
    baseEstimate: [500, 30000],
  },
];

const SEVERITY_WORDS = {
  high:       ['total','destruído','completamente','totalmente','grave','severo','irreparável','perdida','perda total'],
  medium:     ['significativo','considerável','grande','extenso','vários','múltiplos'],
  low:        ['pequeno','ligeiro','superficial','minor','leve','pouco'],
};

const DAMAGE_PATTERNS = [
  /para-choque[s]?\s+(?:traseiro|dianteiro|frontal)?/gi,
  /capô/gi, /mala/gi, /porta[s]?/gi, /vidro[s]?/gi, /para-brisas/gi,
  /farol(?:es)?/gi, /jante[s]?/gi, /pneu[s]?/gi, /espelho[s]?/gi,
  /soalho/gi, /teto/gi, /paredes?/gi, /móveis?/gi, /eletrodoméstico[s]?/gi,
  /cozinha/gi, /sala/gi, /quarto/gi,
];

const PLATE_RE  = /\b\d{2}-[A-Z]{2}-\d{2}\b|\b[A-Z]{2}-\d{2}-[A-Z]{2}\b/gi;
const PLACE_RE  = /(?:na?|em|perto de|junto[ao]?|próximo de)\s+([A-ZÀ-Ú][a-zA-ZÀ-Ú\s,0-9]{3,50})/gi;

export function analyzeClaimText(text: string): ClaimAnalysis {
  const lower = text.toLowerCase();

  // Incident type
  let bestType = 'other';
  let bestScore = 0;
  for (const rule of RULES) {
    const score = rule.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; bestType = rule.type; }
  }
  const confidence = Math.min(0.95, 0.55 + bestScore * 0.12);

  // Severity
  let severity: ClaimAnalysis['severity'] = 'medium';
  if (SEVERITY_WORDS.high.some(w => lower.includes(w))) severity = 'high';
  else if (SEVERITY_WORDS.low.some(w => lower.includes(w))) severity = 'low';

  // Location
  const places: string[] = [];
  let m: RegExpExecArray | null;
  const placeRe = new RegExp(PLACE_RE.source, 'gi');
  while ((m = placeRe.exec(text)) !== null) places.push(m[1].trim());
  const location = places[0] ?? null;

  // Damage items
  const damageItems: string[] = [];
  for (const re of DAMAGE_PATTERNS) {
    const matches = text.match(re);
    if (matches) damageItems.push(...matches.map(s => s.trim().toLowerCase()));
  }

  // Involved parties (plates)
  const plates = text.match(PLATE_RE) ?? [];
  const involvedParties = plates.map(p => `veículo matrícula ${p}`);

  // Estimate
  const rule = RULES.find(r => r.type === bestType);
  const [min, max] = rule?.baseEstimate ?? [200, 2000];
  const severityMult = { low: 0.4, medium: 0.7, high: 1.0, total_loss: 1.5 }[severity];
  const estimated = Math.round((min + (max - min) * severityMult) / 50) * 50;

  // Title
  const typeLabels: Record<string, string> = {
    collision: 'Colisão / Acidente de viação',
    theft: 'Furto ou roubo',
    fire: 'Incêndio',
    flood: 'Inundação / Danos por água',
    glass: 'Quebra de vidros',
    consultation: 'Consulta médica',
    surgery: 'Cirurgia / Internamento',
    liability: 'Responsabilidade civil',
    other: 'Sinistro',
  };

  return {
    incidentType: bestType,
    severity,
    location,
    damageItems: [...new Set(damageItems)].slice(0, 6),
    involvedParties,
    confidence,
    suggestedTitle: typeLabels[bestType] ?? 'Sinistro',
    estimatedAmount: estimated,
  };
}

export function checkCoverage(
  incidentType: string,
  coverages: Array<{ code: string; label: string; limit: number; deductible: number }>
): { covered: boolean; coverage?: typeof coverages[0]; reason: string } {
  const match = coverages.find(c => c.code === incidentType);
  if (match) {
    return {
      covered: true,
      coverage: match,
      reason: `Coberto pela cláusula "${match.label}" (limite €${match.limit.toLocaleString('pt-PT')}, franquia €${match.deductible})`,
    };
  }
  return {
    covered: false,
    reason: `O tipo de sinistro "${incidentType}" não está incluído na sua apólice atual.`,
  };
}
