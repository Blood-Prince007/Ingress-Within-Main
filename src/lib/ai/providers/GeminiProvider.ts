import { 
  AIProvider, 
  ClarityScoreResponse, 
  ReflectionResponse, 
  WeeklySummaryResponse, 
  MonthlyReportResponse, 
  OceanSummaryResponse, 
  ExerciseInsightResponse,
  CrisisDetectionResponse,
  EntryDimensionsScoreResponse,
  WeeklyReportInput,
  WeeklyReportResponse
} from '../types';
import { extractJson } from '../utils';
import { ApiUsageService } from '../../admin/apiUsageService';

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  public lastSystemPrompt: string = '';
  public lastUserContent: string = '';
  public lastRawResponse: string = '';
  public lastUsage: any = null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  private async callGemini<T>(systemPrompt: string, userContent: string): Promise<T> {
    this.lastSystemPrompt = systemPrompt;
    this.lastUserContent = userContent;

    if (!this.apiKey || this.apiKey === 'gemini_development_mock_key_replace_me') {
      console.warn(`[GeminiProvider] Running with mock key. Simulating AI response.`);
      let mockRes: any = null;

      if (systemPrompt.includes('clarityScore')) {
        mockRes = {
          clarityScore: 75,
          sentiment: "anxious",
          stressIndicators: ["work load", "avoidance"]
        };
      } else if (systemPrompt.includes('clinical emotional observation engine') || systemPrompt.includes('clinical observation engine') || systemPrompt.includes('professional therapist observes')) {
        mockRes = {
          classification: "Open",
          reflection: "You tend to keep things fair, clapped in the meeting, and did what was reasonable even when you were exhausted. You are performing to expectations even in this journal where nobody else is looking.",
          closing_nudge: "Sit with that tonight.\nCome back tomorrow and tell me what came up.",
          closing_question: "What would you say about today if you weren't trying to be fair about it?",
          confidence: "high",
          themes: ["Fairness", "Suppression"],
          vocabulary: ["fair", "exhausted", "reasonable"],
          processing_notes: "Simulated clinical observation matching Prompt System v1.0 Open pattern rules."
        };
      } else if (systemPrompt.includes('clinical emotional insights engine') && systemPrompt.includes('Synthesize')) {
        mockRes = {
          title: "Composure vs. Suppression",
          body: "This week showed a pattern of high emotional intensity coupled with avoidance of direct communication.",
          why: "Underlying fear of rejection or conflict.",
          emos: [
            { w: "fine", c: "×4", r: ["managing", "numb"] },
            { w: "tired", c: "×2", r: ["exhausted", "depleted"] }
          ],
          q: "How can you express your needs before feeling depleted?"
        };
      } else if (systemPrompt.includes('Day 28 synthesis report')) {
        mockRes = {
          dimensions: [
            { label: "Emotional intensity", fill: "72%", val: "High", desc: "Significant emotional charge.", color: "bg-[#E0A898]" },
            { label: "Pattern rigidity", fill: "80%", val: "Strong", desc: "Fixed thinking patterns.", color: "bg-[#E0A898]" },
            { label: "Self-agency", fill: "32%", val: "Low", desc: "Feeling helpless.", color: "bg-[#B8A8D4]" },
            { label: "Distress trajectory", fill: "55%", val: "Flat", desc: "No major change.", color: "bg-[#8DBFB4]/70" }
          ],
          insight: "Over the month, you have shown a consistent pattern of suppression."
        };
      } else if (systemPrompt.includes('OCEAN (Big Five)')) {
        mockRes = {
          openness: 70,
          conscientiousness: 60,
          extraversion: 40,
          agreeableness: 80,
          neuroticism: 50,
          analysis: "Based on the assessment, you show moderate openness and high agreeableness, with a tendency to seek harmony."
        };
      } else if (systemPrompt.includes('cognitive behavioral therapist')) {
        mockRes = {
          insight: "Your reframed thought shows a healthy cognitive shift.",
          recommendations: [
            "Practice noticing catastrophizing thoughts as they occur.",
            "Remind yourself of past successes when anxiety rises."
          ]
        };
      } else if (systemPrompt.includes('crisis detection engine')) {
        const lower = userContent.toLowerCase();
        const isCrisisMatch = 
          lower.includes('end my life') || 
          lower.includes('ending my life') || 
          lower.includes('kill myself') || 
          lower.includes('killing myself') || 
          lower.includes('harm myself') || 
          lower.includes('suicide') || 
          lower.includes('end it all');
        mockRes = {
          isCrisis: isCrisisMatch,
          reason: isCrisisMatch ? "Explicit statement of self-harm intent" : ""
        };
      } else if (systemPrompt.includes('psychometric scoring engine')) {
        const hasReflection = userContent.includes('Reflection Text to score: "') && !userContent.includes('Reflection Text to score: None');
        const hasNewEntry = userContent.includes('New Entry Text to score: "') && !userContent.includes('New Entry Text to score: None');
        
        const lower = userContent.toLowerCase();
        const isCrisisMatch = 
          lower.includes('end my life') || 
          lower.includes('ending my life') || 
          lower.includes('kill myself') || 
          lower.includes('killing myself') || 
          lower.includes('harm myself') || 
          lower.includes('suicide') || 
          lower.includes('end it all');

        mockRes = {
          reflection: hasReflection ? (isCrisisMatch ? { ei: 10.0, pr: 10.0, sa: 1.0 } : { ei: 4.5, pr: 5.0, sa: 6.0 }) : null,
          newEntry: hasNewEntry ? (isCrisisMatch ? { ei: 10.0, pr: 10.0, sa: 1.0 } : { ei: 5.5, pr: 6.0, sa: 4.0 }) : null,
          confidenceFlag: false,
          confidenceReason: "Simulated score for development mode",
          riskLanguageDetected: isCrisisMatch,
          riskLanguageQuote: isCrisisMatch ? "Explicit statement of self-harm intent" : null,
          arcScoringApplied: false
        };
      } else if (systemPrompt.includes('AI ANALYSIS GOAL')) {
        mockRes = {
          summary: "You tend to process things internally and find direct conflict uncomfortable. That means things often pile up quietly before they surface. This space is designed for exactly that."
        };
      } else if (systemPrompt.includes('emotional-vocabulary engine') || systemPrompt.includes('extract only meaningful emotional vocabulary')) {
        mockRes = {
          expressions: [
            {
              word: "anxious",
              normalized: "anxious",
              semantic_meaning: "A state of nervousness or apprehension about upcoming tasks.",
              context: "I felt very anxious and sad this morning.",
              confidence: 0.95
            },
            {
              word: "sad",
              normalized: "sad",
              semantic_meaning: "A feeling of unhappiness or sorrow.",
              context: "I felt very anxious and sad this morning.",
              confidence: 0.95
            },
            {
              word: "pressure",
              normalized: "pressure",
              semantic_meaning: "Feeling the weight of expectations regarding career progress.",
              context: "I felt pressure about my career project.",
              confidence: 0.9
            },
            {
              word: "work",
              normalized: "work",
              semantic_meaning: "Daily tasks and obligations at the office.",
              context: "I had a lot of work tasks at the office.",
              confidence: 0.8
            },
            {
              word: "boundaries",
              normalized: "boundary",
              semantic_meaning: "Defining personal limits to prevent exhaustion.",
              context: "I need to establish better boundaries.",
              confidence: 0.85
            },
            {
              word: "habits",
              normalized: "habit",
              semantic_meaning: "Constructive daily routines to support mental health.",
              context: "I need to establish better boundaries and habits.",
              confidence: 0.9
            }
          ]
        };
      } else if (systemPrompt.includes("reflects a person's own word choices back to them")) {
        mockRes = {
          clusters: [
            {
              cluster_name: "Achievement Pressure",
              description: "A recurring feeling of tension and high expectations around career progress and daily tasks.",
              confidence: 0.9,
              words: ["pressure", "work", "task", "project", "career"]
            },
            {
              cluster_name: "Self-Regulation Needs",
              description: "Focusing on establishing healthier habits and boundaries to manage mental load.",
              confidence: 0.85,
              words: ["boundary", "habit", "support", "establish"]
            }
          ]
        };
      } else if (systemPrompt.includes('psychological, emotional, and semantic analysis assistant')) {
        mockRes = {
          validatedWords: [
            { word: "anxious", category: "emotional", is_emotional: true, score: 0.95 },
            { word: "sad", category: "emotional", is_emotional: true, score: 0.95 },
            { word: "pressure", category: "emotional", is_emotional: true, score: 0.9 },
            { word: "work", category: "theme", is_emotional: false, score: 0.8 },
            { word: "boundaries", category: "theme", is_emotional: false, score: 0.85 },
            { word: "habits", category: "theme", is_emotional: false, score: 0.9 }
          ]
        };
      } else if (systemPrompt.includes('psychological concept discovery') || systemPrompt.includes('semantic grouping') || systemPrompt.includes('identify high-level emotional concepts')) {
        mockRes = {
          concepts: [
            { concept: "Responsibility", confidence: 0.95 },
            { concept: "Pressure", confidence: 0.9}
          ],
          clusters: [
            {
              cluster_name: "Achievement Pressure",
              description: "A recurring feeling of tension and high expectations around career progress and daily tasks.",
              confidence: 0.9,
              words: ["pressure", "work", "task", "project", "career"]
            },
            {
              cluster_name: "Self-Regulation Needs",
              description: "Focusing on establishing healthier habits and boundaries to manage mental load.",
              confidence: 0.85,
              words: ["boundary", "habit", "support", "establish"]
            }
          ]
        };
      } else if (systemPrompt.includes('psychologist reviewing the client') || systemPrompt.includes('thoughtful psychologist reviewing') || systemPrompt.includes('clinical psychologist synthesizing a weekly report')) {
        mockRes = {
          title: "Composure vs. Suppression",
          why: "Underlying avoidance of direct emotional expression in favor of maintaining external expectations.",
          weekly_stats: {
            entries_completed: 6,
            total_possible: 7,
            skipped_days: 1,
            skipped_day_numbers: [4],
            writing_streak: 3,
            thread_responses_completed: 2,
            week_range: "1 Jun – 7 Jun",
            cycle_number: 1,
            week_number: 1
          },
          emotional_language: [
            { expression: "tired", frequency: 3, importance: "high", context: "Described exhaustion midweek when dealing with workplace responsibilities.", related: ["drained", "depleted"] },
            { expression: "blank", frequency: 2, importance: "medium", context: "Appeared when writing about social interactions where you felt absent.", related: ["disconnected", "absent"] },
            { expression: "fine", frequency: 3, importance: "high", context: "Used as a conversational buffer when explaining personal states.", related: ["uncertain", "lost"] }
          ],
          week_narrative: "The week began with pressure surrounding work responsibilities and an emphasis on maintaining composure. Midweek, your writing shifted toward exhaustion and feeling drained. By the weekend, your language reflected recovery rather than continued exhaustion, though an undercurrent of resignation remains.",
          vocabulary_evolution: {
            new_expressions: ["blank", "absent"],
            growing_expressions: ["tired", "fine"],
            declining_expressions: ["stressed"]
          },
          pattern_evolution: {
            recurring_themes: ["Suppression of irritation", "Prioritizing other's schedules"],
            repeated_stressors: ["startup discussions", "work shortlist expectations"],
            repeated_strengths: ["intellectual problem solving"],
            coping_strategies: ["withdrawing from phone calls", "internalizing feedback"]
          },
          writing_behaviour: {
            consistency: "High volume early, one sentence by Sunday. Not quieter — emptier.",
            avg_entry_length: 245,
            entry_lengths: [320, 280, 210, 0, 180, 150, 40],
            writing_times: ["22:14", "21:30", "22:05", "", "23:10", "21:45", "23:55"],
            reflection_completion_rate: 0.85,
            thread_completion_rate: 0.66,
            skipped_days: [4],
            engagement_trend: "Steady decrease in word count as the week progressed, ending in a minimal single-sentence entry on Sunday."
          },
          score_evolution: {
            ei: { avg: 6.2, highest: { day: 3, score: 8.1 }, lowest: { day: 7, score: 4.0 }, interpretation: "Emotional intensity peaked midweek, reflecting rising frustration with work pressures." },
            pr: { avg: 5.8, highest: { day: 2, score: 7.0 }, lowest: { day: 7, score: 4.5 }, interpretation: "Pattern rigidity remained elevated throughout, indicating reliance on familiar deflection strategies." },
            sa: { avg: 4.5, highest: { day: 5, score: 6.5 }, lowest: { day: 3, score: 2.0 }, interpretation: "Self-agency dipped significantly on Day 3 during the shortlist announcement, before recovering slightly." }
          },
          open_threads_review: {
            active: ["Is avoiding the argument the same as keeping the peace?"],
            resolved_this_week: ["Handling daily work tasks"],
            continued_throughout: ["Career direction uncertainty"],
            summary: "Avoidance remains an active core theme. Two threads remain active, while one regarding immediate task execution was resolved."
          },
          crisis_review: {
            occurred: false,
            summary: "No crisis indicators were detected this week.",
            events: []
          },
          growth_reflection: "You expected to care about the shortlist. You didn't. You haven't been able to stop thinking about that. Every place this week where the question was 'what do you actually think' — you weren't there.",
          reflection_question: "What would it look like to actually say the thing instead of absorbing it?"
        };
      }

      if (mockRes) {
        this.lastRawResponse = JSON.stringify(mockRes, null, 2);
        this.lastUsage = { prompt_tokens: 270, completion_tokens: 130, total_tokens: 400 };
        ApiUsageService.recordEvent({
          provider: 'gemini',
          service: 'ai_inference_mock',
          endpoint: 'generativelanguage.googleapis.com',
          statusCode: 200,
          success: true,
          latencyMs: 35,
          model: this.model,
          inputTokens: 270,
          outputTokens: 130,
        });
        return mockRes as T;
      }
      throw new Error(`[GeminiProvider Mock] Unsupported prompt template.`);
    }

    let attempts = 5;
    let delayMs = 15000;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      const callStart = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        let response: Response;
        try {
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: userContent
                    }
                  ]
                }
              ],
              systemInstruction: {
                parts: [
                  {
                    text: `${systemPrompt}\nYou must return a valid JSON object matching the requested schema. Do not output any conversational introduction or explanation.`
                  }
                ]
              },
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
              }
            }),
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeoutId);
        }

        const latencyMs = Date.now() - callStart;

        if (response.status === 429) {
          const errText = await response.text();
          ApiUsageService.recordEvent({
            provider: 'gemini',
            service: 'ai_inference',
            endpoint: 'generativelanguage.googleapis.com',
            statusCode: 429,
            success: false,
            latencyMs,
            model: this.model,
            errorCategory: 'RATE_LIMIT',
          });

          console.warn(`[GeminiProvider] 429 Detail: ${errText}`);
          if (attempt === attempts) {
            throw new Error(`Gemini API returned HTTP error 429 (Rate Limit Exceeded) after all attempts: ${errText}`);
          }
          console.warn(`[GeminiProvider] Rate limit hit (429). Attempt ${attempt} of ${attempts}. Waiting ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2.0;
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          ApiUsageService.recordEvent({
            provider: 'gemini',
            service: 'ai_inference',
            endpoint: 'generativelanguage.googleapis.com',
            statusCode: response.status,
            success: false,
            latencyMs,
            model: this.model,
            errorCategory: 'API_ERROR',
          });
          throw new Error(`Gemini API returned HTTP error ${response.status}: ${errText}`);
        }

        const payload = await response.json();
        const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          throw new Error('Gemini API returned an empty completion response.');
        }

        this.lastRawResponse = rawText;
        const inTok = payload.usageMetadata?.promptTokenCount || 0;
        const outTok = payload.usageMetadata?.candidatesTokenCount || 0;

        this.lastUsage = payload.usageMetadata
          ? {
              prompt_tokens: inTok,
              completion_tokens: outTok,
              total_tokens: payload.usageMetadata.totalTokenCount || (inTok + outTok)
            }
          : null;

        ApiUsageService.recordEvent({
          provider: 'gemini',
          service: 'ai_inference',
          endpoint: 'generativelanguage.googleapis.com',
          statusCode: 200,
          success: true,
          latencyMs,
          model: this.model,
          inputTokens: inTok,
          outputTokens: outTok,
        });

        return extractJson<T>(rawText);
      } catch (error: any) {
        const latencyMs = Date.now() - callStart;
        ApiUsageService.recordEvent({
          provider: 'gemini',
          service: 'ai_inference',
          endpoint: 'generativelanguage.googleapis.com',
          statusCode: 500,
          success: false,
          latencyMs,
          model: this.model,
          errorCategory: error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
        });
        throw error;
      }
    }
    throw new Error('GeminiProvider callGemini completed loop without returning or throwing.');
  }

  // --- AIProvider Interface Implementations ---

  async scoreEntry(content: string): Promise<ClarityScoreResponse> {
    const systemPrompt = `You are a psychological and emotional analysis assistant.
Analyze the user's journal entry and return:
- "clarityScore" (0-100 score reflecting self-processing depth, clarity, coherence, and emotional articulation).
- "sentiment" (primary emotional tone, e.g., anxious, content, sad, reflective, stressed).
- "stressIndicators" (up to 3 key stressors mentioned, e.g., work, relationships, self-doubt).

Format must be a JSON object with:
{
  "clarityScore": number,
  "sentiment": string,
  "stressIndicators": string[]
}`;
    return this.callGemini<ClarityScoreResponse>(systemPrompt, content);
  }

  async generateReflection(
    entryContent: string,
    context?: string,
    latestThread?: string,
    previousReflection?: string,
    useSimplifiedPrompt?: boolean
  ): Promise<ReflectionResponse> {
    const systemPrompt = `You are a thoughtful clinical psychologist reviewing a client's daily journal entry.
Provide an insightful reflection back to the user that:
1. Helps them see their own underlying patterns, defenses, or avoidance strategies.
2. Formulates a closing nudge or next step.
3. Formulates a direct, open-ended clinical question to guide further reflection.
4. STRICT TONE REQUIREMENT: Always write in the first-person ("I", "my") or address the user directly ("you", "your"). NEVER use third-person terms like "the user", "the writer", "he/she", or "they".

Format must be a JSON object matching this schema:
{
  "classification": "Flat" | "Open" | "Scattered",
  "reflection": "therapeutic reflection writing",
  "closing_nudge": "supportive clinical nudge",
  "closing_question": "open-ended question",
  "confidence": "high" | "medium" | "low",
  "themes": ["theme1", "theme2"],
  "vocabulary": ["word1", "word2"],
  "processing_notes": "notes"
}`;

    const userContent = JSON.stringify({
      entryContent,
      context: context || '',
      latestThread: latestThread || '',
      previousReflection: previousReflection || ''
    });

    return this.callGemini<ReflectionResponse>(systemPrompt, userContent);
  }

  async generateWeeklySummary(
    entries: { content: string; created_at: string }[],
    personalitySummary?: string
  ): Promise<WeeklySummaryResponse> {
    const systemPrompt = `You are a clinical psychologist synthesizing a weekly summary of the client's journaling.
Provide:
- A title capturing the weekly theme.
- A summary of their emotional states, themes, and behavioral patterns.
- An open clinical question for their upcoming weekly reflection thread.
- A list of prominent emotion vocabulary words used.
- STRICT TONE REQUIREMENT: Always write in the first-person ("I", "my") or address the user directly ("you", "your"). NEVER use third-person terms like "the user", "the writer", "he/she", or "they".

Format must be a JSON object matching:
{
  "title": string,
  "body": string,
  "why": string,
  "emos": [{ "w": "word", "c": "count", "r": ["synonyms"] }],
  "q": string
}`;
    return this.callGemini<WeeklySummaryResponse>(systemPrompt, JSON.stringify({ entries, personalitySummary }));
  }

  async generateMonthlyReport(entries: { content: string; created_at: string }[]): Promise<MonthlyReportResponse> {
    const systemPrompt = `You are a clinical psychologist reviewing a month's worth of journal entries.
Generate a Day 28 synthesis report showing dimensions (Emotional intensity, Pattern rigidity, Self-agency, Distress trajectory) and a summary narrative insight.
- STRICT TONE REQUIREMENT: Always write in the first-person ("I", "my") or address the user directly ("you", "your"). NEVER use third-person terms like "the user", "the writer", "he/she", or "they".

Format must be a JSON object matching:
{
  "dimensions": [
    { "label": "Emotional intensity", "fill": "percentage", "val": "High/Medium/Low", "desc": "description", "color": "bg-class" }
  ],
  "insight": string
}`;
    return this.callGemini<MonthlyReportResponse>(systemPrompt, JSON.stringify(entries));
  }

  async generateOceanSummary(entries: { content: string; created_at: string }[]): Promise<OceanSummaryResponse> {
    const systemPrompt = `Analyze the writing history to score the OCEAN (Big Five) personality traits (0-100) and provide an analysis summary.
Format must be a JSON object matching:
{
  "openness": number,
  "conscientiousness": number,
  "extraversion": number,
  "agreeableness": number,
  "neuroticism": number,
  "analysis": string
}`;
    return this.callGemini<OceanSummaryResponse>(systemPrompt, JSON.stringify(entries));
  }

  async generatePersonalitySummary(scores: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  }): Promise<string> {
    const systemPrompt = `You are a clinical psychologist explaining a client's Big Five personality summary in a supportive, therapeutic voice.
Return a 3-4 sentence paragraph addressing the user directly as "you" ("your").
Return ONLY the text paragraph directly.`;
    
    try {
      const response = await this.callRaw(`${systemPrompt}\n\nScores: ${JSON.stringify(scores)}`);
      return response;
    } catch {
      return "Based on your personality profiling, you exhibit a reflective disposition with a focus on self-regulation and emotional awareness.";
    }
  }

  async generateExerciseInsight(
    stressorType: string,
    reactiveThought: string,
    reframedThought: string
  ): Promise<ExerciseInsightResponse> {
    const systemPrompt = `You are a cognitive behavioral therapist reviewing a user's completed reframing exercise.
Analyze:
Stressor: ${stressorType}
Automatic Thought: ${reactiveThought}
Reframed Thought: ${reframedThought}

Provide a supportive insight and 2 actionable recommendations.
- STRICT TONE REQUIREMENT: Always write in the first-person ("I", "my") or address the user directly ("you", "your"). NEVER use third-person terms like "the user", "the writer", "he/she", or "they".

Format must be a JSON object matching:
{
  "insight": string,
  "recommendations": string[]
}`;
    return this.callGemini<ExerciseInsightResponse>(systemPrompt, JSON.stringify({ stressorType, reactiveThought, reframedThought }));
  }

  async detectCrisis(content: string): Promise<CrisisDetectionResponse> {
    const systemPrompt = `You are a crisis detection engine. Analyze the text for any explicit intent, ideation, or plan of self-harm or suicide.
Format must be a JSON object matching:
{
  "isCrisis": boolean,
  "reason": "explanation if true, empty otherwise"
}`;
    return this.callGemini<CrisisDetectionResponse>(systemPrompt, content);
  }

  async scoreEntryDimensions(
    reflectionText?: string | null,
    newEntryText?: string | null,
    personalityContext?: string | null
  ): Promise<EntryDimensionsScoreResponse> {
    const systemPrompt = `You are a clinical psychometric scoring engine. Score the Emotional Intensity (ei), Processing Depth (pr), and Self-Agency (sa) on a 1.0 to 10.0 scale.
Format must be a JSON object matching:
{
  "reflection": { "ei": number, "pr": number, "sa": number } or null,
  "newEntry": { "ei": number, "pr": number, "sa": number } or null,
  "confidenceFlag": boolean,
  "confidenceReason": string,
  "riskLanguageDetected": boolean,
  "riskLanguageQuote": string or null,
  "arcScoringApplied": boolean
}`;
    return this.callGemini<EntryDimensionsScoreResponse>(systemPrompt, JSON.stringify({ reflectionText, newEntryText, personalityContext }));
  }

  async extractVocabulary(entryContent: string): Promise<{
    expressions: {
      word: string;
      normalized: string;
      semantic_meaning: string;
      context: string;
      confidence: number;
    }[];
  }> {
    const systemPrompt = `You are the emotional-vocabulary engine inside Ingress Within. Your task is to analyze the user's journal entry or thread response and extract only meaningful emotional vocabulary.

CRITICAL REQUIREMENTS:
- DO NOT extract articles, pronouns, verbs (unless part of an emotional phrase like "let go"), filler words, generic nouns, or non-emotional words.
- DO NOT extract functional descriptions, daily tasks, neutral objects, or generic nouns (e.g., "today", "office", "presentation", "coffee", "computer", "meeting", "project", "road", "work", "went", "think", "do", "phone").
- ONLY extract words or expressions that describe internal emotional states, feelings, or psychological experiences. Examples: "hopeful", "anxious", "drained", "relieved", "grateful", "tense", "overwhelmed", "confident", "lonely", "empty", "content", "peaceful", "frustrated".
- The extraction must be context-aware. If the user writes a multi-word phrase like "on edge", "burnt out", "let go", "emotionally exhausted", or "mentally drained", extract the full emotional phrase (e.g., "on edge" instead of just "edge").

For each extracted term, provide:
1. "word": The literal expression as it appears in the text.
2. "normalized": The canonical, singular, lowercased form of the expression (e.g., "anxious" for "anxiety" or "anxiousness", "on edge" for "on edge").
3. "semantic_meaning": A concise description of the word's contextual meaning in this entry.
4. "context": The exact sentence where it was used.
5. "confidence": A confidence score between 0.0 and 1.0.

Return a valid JSON object matching the requested schema:
{
  "expressions": [
    {
      "word": "on edge",
      "normalized": "on edge",
      "semantic_meaning": "A state of feeling tense, nervous, or irritable.",
      "context": "I was feeling on edge all morning.",
      "confidence": 0.98
    }
  ]
}`;
    return this.callGemini<any>(systemPrompt, entryContent);
  }

  async extractConcepts(entryContent: string): Promise<{ concepts: { concept: string; confidence: number }[] }> {
    const systemPrompt = `Extract high-level psychological or personal concepts from the writing.
Format must be a JSON object matching:
{
  "concepts": [
    { "concept": string, "confidence": number }
  ]
}`;
    return this.callGemini<any>(systemPrompt, entryContent);
  }

  async groupClusters(
    words: { word: string; normalized_word: string; frequency: number; semantic_meaning?: string }[]
  ): Promise<{
    clusters: {
      cluster_name: string;
      description: string;
      confidence: number;
      words: string[];
    }[];
  }> {
    const systemPrompt = `Group emotional vocabulary words into semantic/psychological theme clusters.
Format must be a JSON object matching:
{
  "clusters": [
    { "cluster_name": string, "description": string, "confidence": number, "words": string[] }
  ]
}`;
    return this.callGemini<any>(systemPrompt, JSON.stringify(words));
  }

  async scoreEmotionalRelevance(words: string[], entryContent: string): Promise<{ validatedWords: { word: string; is_emotional: boolean; category?: 'emotional' | 'theme' | 'general'; score: number }[] }> {
    const systemPrompt = `Classify words into "emotional", "theme", or "general" categories based on the entry context.
Format must be a JSON object matching:
{
  "validatedWords": [
    { "word": string, "category": "emotional" | "theme" | "general", "is_emotional": boolean, "score": number }
  ]
}`;
    return this.callGemini<any>(systemPrompt, JSON.stringify({ words, entryContent }));
  }

  async generateWeeklyReport(data: WeeklyReportInput): Promise<WeeklyReportResponse> {
    const systemPrompt = `You are a clinical psychologist synthesizing a comprehensive weekly report based on stats and entries.
- STRICT TONE REQUIREMENT: Always write in the first-person ("I", "my") or address the user directly ("you", "your"). NEVER use third-person terms like "the user", "the writer", "he/she", or "they".

Format must be a JSON object matching the requested schema.`;
    return this.callGemini<WeeklyReportResponse>(systemPrompt, JSON.stringify(data));
  }

  async callRaw(prompt: string): Promise<string> {
    this.lastSystemPrompt = "Raw Completion";
    this.lastUserContent = prompt;

    if (!this.apiKey || this.apiKey.startsWith('mock_') || this.apiKey === 'gemini_development_mock_key_replace_me') {
      console.warn(`[GeminiProvider] Running with mock key. Simulating callRaw response.`);
      if (prompt.includes('pattern-detection system') || prompt.includes('pattern_name')) {
        const mockPatterns = [
          {
            pattern_name: "Avoidance",
            pattern_category: "behavioural",
            supporting_phrase: "I didn't say anything",
            supporting_sentence: "I didn't say anything. It felt easier.",
            confidence: 0.88,
            reasoning: "Writer chooses silence rather than engagement"
          }
        ];
        this.lastRawResponse = JSON.stringify(mockPatterns);
        return this.lastRawResponse;
      }
      return "[]";
    }

    let attempts = 5;
    let delayMs = 15000;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        let response: Response;
        try {
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: prompt
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.1
              }
            }),
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (response.status === 429) {
          const errText = await response.text();
          console.warn(`[GeminiProvider] 429 Detail: ${errText}`);
          if (attempt === attempts) {
            throw new Error(`Gemini API returned HTTP error 429 (Rate Limit Exceeded) after all attempts: ${errText}`);
          }
          console.warn(`[GeminiProvider] Rate limit hit (429). Attempt ${attempt} of ${attempts}. Waiting ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2.0;
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API returned HTTP error ${response.status}: ${errText}`);
        }

        const payload = await response.json();
        const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          throw new Error('Gemini API returned an empty completion response.');
        }

        this.lastRawResponse = rawText;
        return rawText;
      } catch (error) {
        if (attempt === attempts) {
          console.error('[GeminiProvider] API request failed after all attempts:', error);
          throw error;
        }
        console.warn(`[GeminiProvider] Request failed on attempt ${attempt}. Retrying in ${delayMs}ms... Error: ${error instanceof Error ? error.message : String(error)}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2.0;
      }
    }
    throw new Error('GeminiProvider callRaw completed loop without returning or throwing.');
  }
}
