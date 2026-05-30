import { storageService } from './StorageService';

const API_KEY_STORAGE = 'ai:api_key';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const VISION_MODEL = 'claude-sonnet-4-6';
const PROMPT_CACHE_BETA = 'prompt-caching-2024-07-31';

const PHOTO_SYSTEM_PROMPT = `Je bent een voedingsexpert die foto's van maaltijden analyseert. Analyseer de foto en schat de voedingswaarden zo nauwkeurig mogelijk in.

KRITIEKE INSTRUCTIE: Begin ELKE reactie met een geldig JSON object. Geen tekst ervoor.

FORMAT (altijd dit):
{"type":"food","items":[{"name":"Naam gerecht","calories":400,"protein":25,"carbs":45,"fat":12,"servingSize":1,"servingUnit":"portie","mealType":"lunch"}],"message":"Korte beschrijving van wat je ziet"}

REGELS:
- Altijd Nederlands
- Schat porties op basis van wat zichtbaar is op de foto
- Bij meerdere componenten, maak meerdere items of combineer tot één gerecht
- mealType: breakfast/lunch/dinner/snack (schat op basis van het gerecht)
- Wees eerlijk als iets onduidelijk is, maar geef altijd een schatting
- Gebruik realistische Nederlandse portie-groottes`;

export interface ParsedFoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface ParsedWorkout {
  name: string;
  type:
    | 'running'
    | 'walking'
    | 'cycling'
    | 'swimming'
    | 'strength'
    | 'yoga'
    | 'hiit'
    | 'other';
  durationMinutes: number;
  caloriesBurned: number;
  notes?: string;
}

export type AIResponse =
  | { kind: 'food'; items: ParsedFoodItem[]; message: string }
  | { kind: 'workout'; workout: ParsedWorkout; message: string }
  | { kind: 'chat'; message: string };

const SYSTEM_PROMPT = `Je bent een gezondheids-assistent in een health tracker app. Je helpt gebruikers voeding en trainingen te loggen.

KRITIEKE INSTRUCTIE: Begin ELKE reactie met een geldig JSON object. Geen tekst ervoor, geen markdown, geen uitleg ervoor. Alleen JSON eerst.

FORMAT VOOR VOEDING (als gebruiker eten beschrijft):
{"type":"food","items":[{"name":"Boterham met hagelslag","calories":180,"protein":4,"carbs":32,"fat":5,"servingSize":1,"servingUnit":"snee","mealType":"breakfast"}],"message":"Korte uitleg in het Nederlands"}

FORMAT VOOR TRAINING:
{"type":"workout","workout":{"name":"Hardlopen","type":"running","durationMinutes":30,"caloriesBurned":280,"notes":""},"message":"Korte uitleg in het Nederlands"}

FORMAT VOOR VRAGEN:
{"type":"chat","message":"Antwoord in het Nederlands"}

REGELS:
- Altijd Nederlands
- mealType: breakfast/lunch/dinner/snack (schat op basis van context)
- workout type: running/walking/cycling/swimming/strength/yoga/hiit/other
- Meerdere items zijn toegestaan in het items array
- Schat porties nauwkeurig op basis van Nederlandse standaarden
- Gebruik realistische caloriewaarden (boterham ≈ 70kcal, met hagelslag erbij +50kcal)
- Het JSON object staat ALTIJD op de allereerste regel, gevolgd door een witregel en dan uitleg`;

class AIService {
  private static instance: AIService;
  static getInstance() {
    if (!AIService.instance) AIService.instance = new AIService();
    return AIService.instance;
  }

  async getApiKey(): Promise<string | null> {
    return storageService.get<string>(API_KEY_STORAGE);
  }

  async saveApiKey(key: string): Promise<void> {
    await storageService.set(API_KEY_STORAGE, key.trim());
  }

  async clearApiKey(): Promise<void> {
    await storageService.set(API_KEY_STORAGE, null);
  }

  async analyzePhoto(
    base64Image: string,
    mimeType: string = 'image/jpeg',
  ): Promise<AIResponse> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return {
        kind: 'chat',
        message: 'Voer eerst je Anthropic API sleutel in via de instellingen.',
      };
    }

    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 1024,
        system: PHOTO_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: 'Analyseer deze maaltijd en geef de voedingswaarden terug.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      if (response.status === 401) {
        return { kind: 'chat', message: 'Ongeldige API sleutel.' };
      }
      throw new Error(`API fout ${response.status}: ${err}`);
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text ?? '';
    return this.parseResponse(raw);
  }

  async chat(
    userMessage: string,
    history: { role: 'user' | 'assistant'; content: string }[] = [],
    healthContext?: string,
  ): Promise<AIResponse> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return {
        kind: 'chat',
        message: 'Voer eerst je Anthropic API sleutel in via de instellingen.',
      };
    }

    const messages = [
      ...history.slice(-10),
      { role: 'user' as const, content: userMessage },
    ];

    // System as array enables prompt caching on the static prompt block
    const system: object[] = [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ];
    if (healthContext) {
      system.push({ type: 'text', text: healthContext });
    }

    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': PROMPT_CACHE_BETA,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      if (response.status === 401) {
        return {
          kind: 'chat',
          message:
            'Ongeldige API sleutel. Controleer je sleutel in de instellingen.',
        };
      }
      throw new Error(`API fout ${response.status}: ${err}`);
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text ?? '';

    return this.parseResponse(raw);
  }

  async generateWeeklyReport(data: {
    nutrition: Array<{
      date: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      entries: number;
    }>;
    fitness: Array<{
      date: string;
      caloriesBurned: number;
      durationMinutes: number;
      workouts: number;
    }>;
    goals: {
      dailyCaloriesTarget: number;
      dailyProteinTarget: number;
      dailyStepsTarget: number;
    };
    weightChange?: number | null;
  }): Promise<string> {
    const apiKey = await this.getApiKey();
    if (!apiKey) throw new Error('Geen API sleutel ingesteld.');

    const daysLogged = data.nutrition.filter(d => d.entries > 0).length;
    const avgCals =
      daysLogged > 0
        ? Math.round(
            data.nutrition.reduce((s, d) => s + d.calories, 0) / daysLogged,
          )
        : 0;
    const totalWorkouts = data.fitness.reduce((s, d) => s + d.workouts, 0);
    const totalMinutes = data.fitness.reduce(
      (s, d) => s + d.durationMinutes,
      0,
    );

    const prompt = `Analyseer deze gezondheidsweek en schrijf een persoonlijk weekrapport in het Nederlands.

DATA AFGELOPEN 7 DAGEN:
- Voeding gelogd: ${daysLogged}/7 dagen
- Gem. calorieën: ${avgCals} kcal (doel: ${data.goals.dailyCaloriesTarget})
- Voedingsdagen: ${data.nutrition
      .map(d => `${d.date}: ${d.calories}kcal, ${d.protein}g eiwit`)
      .join(' | ')}
- Trainingen: ${totalWorkouts} (${totalMinutes} min totaal)
- Trainingsdagen: ${data.fitness
      .map(d =>
        d.workouts > 0
          ? `${d.date}: ${d.workouts}x (${d.durationMinutes}min)`
          : null,
      )
      .filter(Boolean)
      .join(' | ')}
${
  data.weightChange != null
    ? `- Gewichtsverandering: ${
        data.weightChange > 0 ? '+' : ''
      }${data.weightChange.toFixed(1)} kg`
    : ''
}

Schrijf een motiverend en eerlijk weekrapport met deze structuur (gebruik markdown):

## 🏆 Week Samenvatting
[2-3 zinnen overall]

## 💪 Wat ging goed
[2-3 bullet points met concrete positieve dingen]

## 📈 Verbeterpunten
[2-3 concrete, actionable tips voor volgende week]

## 🎯 Focus voor volgende week
[1 specifiek doel voor de komende week]

Wees persoonlijk, gebruik de data, en houd het motiverend maar eerlijk.`;

    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Ongeldige API sleutel.');
      throw new Error(`API fout ${response.status}`);
    }

    const json = await response.json();
    return json.content?.[0]?.text ?? '';
  }

  async generateDailyReport(data: {
    date: string;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      entries: { name: string; calories: number; mealType: string }[];
    };
    fitness: {
      caloriesBurned: number;
      durationMinutes: number;
      workouts: {
        name: string;
        durationMinutes: number;
        caloriesBurned: number;
      }[];
    };
    water: number;
    goals: {
      dailyCaloriesTarget: number;
      dailyProteinTarget: number;
      dailyCarbsTarget: number;
      dailyFatTarget: number;
      dailyWaterTarget: number;
    };
    health?: {
      steps?: number;
      heartRateAvg?: number | null;
      sleepHours?: number | null;
    } | null;
  }): Promise<string> {
    const apiKey = await this.getApiKey();
    if (!apiKey) throw new Error('Geen API sleutel ingesteld.');

    const calPct =
      data.goals.dailyCaloriesTarget > 0
        ? Math.round(
            (data.nutrition.calories / data.goals.dailyCaloriesTarget) * 100,
          )
        : 0;
    const waterPct = Math.round(
      (data.water / data.goals.dailyWaterTarget) * 100,
    );

    const prompt = `Analyseer deze gezondheidsdag en schrijf een persoonlijk dagrapport in het Nederlands.

DATUM: ${data.date}

VOEDING (${data.nutrition.entries.length} maaltijden gelogd):
- Calorieën: ${data.nutrition.calories} / ${
      data.goals.dailyCaloriesTarget
    } kcal (${calPct}%)
- Eiwit: ${Math.round(data.nutrition.protein)}g / ${
      data.goals.dailyProteinTarget
    }g
- Koolhydraten: ${Math.round(data.nutrition.carbs)}g / ${
      data.goals.dailyCarbsTarget
    }g
- Vet: ${Math.round(data.nutrition.fat)}g / ${data.goals.dailyFatTarget}g
- Maaltijden: ${
      data.nutrition.entries
        .map(e => `${e.name} (${e.calories} kcal, ${e.mealType})`)
        .join(', ') || 'Niets gelogd'
    }

WATER: ${Math.round((data.water / 1000) * 10) / 10}L / ${
      data.goals.dailyWaterTarget / 1000
    }L (${waterPct}%)

BEWEGING:
${
  data.fitness.workouts.length > 0
    ? data.fitness.workouts
        .map(
          w =>
            `- ${w.name}: ${w.durationMinutes} min, ${w.caloriesBurned} kcal verbrand`,
        )
        .join('\n')
    : '- Geen training gelogd'
}
${
  data.health?.steps
    ? `- Stappen: ${data.health.steps.toLocaleString('nl')}`
    : ''
}
${
  data.health?.heartRateAvg
    ? `- Hartslag gem.: ${data.health.heartRateAvg} bpm`
    : ''
}
${data.health?.sleepHours ? `- Slaap: ${data.health.sleepHours} uur` : ''}

Schrijf een kort, motiverend dagrapport met deze structuur (gebruik markdown):

## ${data.date} — Dagrapport

## ✅ Hoogtepunten
[2-3 bullet points met wat goed ging vandaag]

## 💡 Tip voor morgen
[1 concrete, persoonlijke tip gebaseerd op de data van vandaag]

## 🎯 Score: X/10
[Geef een score van 1-10 met een korte motivatie in 1 zin]

Wees eerlijk, specifiek, en gebruik de data. Houd het kort (max 150 woorden).`;

    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Ongeldige API sleutel.');
      throw new Error(`API fout ${response.status}`);
    }

    const json = await response.json();
    return json.content?.[0]?.text ?? '';
  }

  private stripMarkdown(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, '') // code blocks
      .replace(/`([^`]+)`/g, '$1') // inline code
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1') // italic
      .replace(/^#{1,6}\s+/gm, '') // headings
      .replace(/^\s*[-*]\s+/gm, '• ') // bullet lists
      .replace(/^\s*\d+\.\s+/gm, '') // numbered lists
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/\n{3,}/g, '\n\n') // triple newlines
      .trim();
  }

  private parseResponse(raw: string): AIResponse {
    try {
      const jsonBlocks = this.extractJsonBlocks(raw);
      for (const block of jsonBlocks) {
        try {
          const parsed = JSON.parse(block);
          if (
            parsed.type === 'food' &&
            Array.isArray(parsed.items) &&
            parsed.items.length > 0
          ) {
            const msg = this.stripMarkdown(
              this.extractMessage(raw, parsed.message),
            );
            return { kind: 'food', items: parsed.items, message: msg };
          }
          if (parsed.type === 'workout' && parsed.workout) {
            const msg = this.stripMarkdown(
              this.extractMessage(raw, parsed.message),
            );
            return { kind: 'workout', workout: parsed.workout, message: msg };
          }
          if (parsed.type === 'chat' && parsed.message) {
            return {
              kind: 'chat',
              message: this.stripMarkdown(parsed.message),
            };
          }
        } catch {}
      }
    } catch {}
    const cleaned = raw.replace(/\{[\s\S]*?\}/g, '').trim();
    return { kind: 'chat', message: this.stripMarkdown(cleaned || raw) };
  }

  /** Extract all balanced { } blocks from a string */
  private extractJsonBlocks(text: string): string[] {
    const blocks: string[] = [];
    let depth = 0;
    let start = -1;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (text[i] === '}') {
        depth--;
        if (depth === 0 && start !== -1) {
          blocks.push(text.slice(start, i + 1));
          start = -1;
        }
      }
    }
    return blocks;
  }

  private extractMessage(raw: string, fallback?: string): string {
    // Return text after the first JSON block as the human-readable message
    const afterJson = raw.replace(/^\s*\{[\s\S]*?\}\s*\n?/, '').trim();
    return afterJson || fallback || raw;
  }
}

export const aiService = AIService.getInstance();
