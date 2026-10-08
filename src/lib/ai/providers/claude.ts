import Anthropic from '@anthropic-ai/sdk';
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

export class ClaudeProvider implements AIProvider {
  private client: Anthropic | null = null;
  public apiKey: string;
  public model: string;

  public lastSystemPrompt: string = '';
  public lastUserContent: string = '';
  public lastRawResponse: string = '';
  public lastUsage: any = null;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_KEY || '';
    this.model = model || process.env.CLAUDE_MODEL || process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

    if (this.apiKey && !this.apiKey.startsWith('mock_') && this.apiKey !== 'sk-ant-development-mock-key-replace-me') {
      try {
        const baseURL = process.env.ANTHROPIC_BASE_URL || process.env.CLAUDE_BASE_URL;
        this.client = new Anthropic({
          apiKey: this.apiKey,
          ...(baseURL ? { baseURL } : {})
        });
      } catch (err) {
        console.warn('[ClaudeProvider] Failed to initialize Anthropic client:', err);
      }
    }
  }

  private getEffectiveApiKey(): string {
    return this.apiKey || process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_KEY || '';
  }

  private getEffectiveModel(): string {
    return this.model || process.env.CLAUDE_MODEL || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  }

  private async callClaude<T>(systemPrompt: string, userContent: string): Promise<T> {
    this.lastSystemPrompt = systemPrompt;
    this.lastUserContent = userContent;

    const effectiveKey = this.getEffectiveApiKey();
    const effectiveModel = this.getEffectiveModel();

    // Check if running with mock key for isolated local unit tests
    if (effectiveKey && (effectiveKey.startsWith('mock_') || effectiveKey === 'sk-ant-development-mock-key-replace-me')) {
      console.warn(`[ClaudeProvider] Running with mock key. Simulating AI response.`);
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
      } else if (systemPrompt.includes('clinical emotional insights engine') || systemPrompt.includes('synthesizing')) {
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
      } else if (systemPrompt.includes('psychiatric crisis detection engine') || systemPrompt.includes('crisis detection engine')) {
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
      } else if (systemPrompt.includes('personality analysis assistant') || systemPrompt.includes('AI ANALYSIS GOAL')) {
        mockRes = {
          summary: "You tend to process things internally and find direct conflict uncomfortable. That means things often pile up quietly before they surface. This space is designed for exactly that."
        };
      } else if (systemPrompt.includes('emotional-vocabulary engine') || systemPrompt.includes('extract only meaningful emotional vocabulary')) {
        mockRes = {
          expressions: [
            {
              word: "tired",
              normalized: "tired",
              semantic_meaning: "Feeling physically or mentally exhausted.",
              context: "I felt very tired this morning.",
              confidence: 0.95
            },
            {
              word: "exhausted",
              normalized: "exhausted",
              semantic_meaning: "A state of extreme physical or mental fatigue.",
              context: "I was exhausted after work.",
              confidence: 0.95
            },
            {
              word: "fine",
              normalized: "fine",
              semantic_meaning: "A conversational buffer representing compliance or suppression.",
              context: "Everything is fine.",
              confidence: 0.9
            },
            {
              word: "managing",
              normalized: "managing",
              semantic_meaning: "Coping with difficulties or stress.",
              context: "I am managing my work.",
              confidence: 0.85
            }
          ]
        };
      } else if (systemPrompt.includes("reflects a person's own word choices back to them")) {
        mockRes = {
          clusters: [
            {
              cluster_name: "depletion",
              description: "Tired is about energy. Exhausted implies recovery needed. Depleted implies something was taken. Worth sitting with which one is actually true.",
              confidence: 0.95,
              words: ["tired", "exhausted"]
            },
            {
              cluster_name: "avoidance",
              description: "\"Fine\" almost always appears when describing yourself — never about situations or other people. That pattern is worth noticing.",
              confidence: 0.95,
              words: ["fine", "managing"]
            }
          ]
        };
      } else if (systemPrompt.includes('psychological, emotional, and semantic analysis assistant')) {
        mockRes = {
          validatedWords: [
            { word: "tired", category: "emotional", is_emotional: true, score: 0.95 },
            { word: "exhausted", category: "emotional", is_emotional: true, score: 0.95 },
            { word: "fine", category: "emotional", is_emotional: true, score: 0.9 },
            { word: "managing", category: "emotional", is_emotional: true, score: 0.85 }
          ]
        };
      } else if (systemPrompt.includes('psychologist reviewing the client') || systemPrompt.includes('thoughtful psychologist reviewing')) {
        mockRes = {
          title: "Composure vs. Suppression",
          why: "Underlying avoidance of direct emotional expression in favor of maintaining external expectations.",
          weekly_stats: {
            entries_completed: 6,
            total_possible: 7,
            skipped_days: 1,
            writing_streak: 3,
            thread_responses_completed: 2,
            week_range: "Jun 10 - Jun 16",
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
      } else if (systemPrompt.includes('Return only valid JSON') && systemPrompt.includes('week_tone')) {
        mockRes = {
          week_tone: "A week of staying polite on the surface while feeling increasingly disconnected underneath.",
          what_we_saw: "You kept every commitment and stayed calm in meetings where people were dropping the ball. When asked how you were doing, you gave the standard fine and got back to work.\n\nKeeping the peace worked for everyone in the room except you.",
          carry_question: "You said you did what was reasonable even though you were exhausted. What would you have done if being reasonable wasn't your first priority?",
          candidate_quote: "I didn't say anything because it wasn't worth the conversation.",
          since_last_week: {
            last_week_words: [],
            this_week_words: ["fine", "tired", "reasonable"]
          },
          emotion_clusters: [
            { word: "fine", related: ["managing", "numb", "deflecting"] },
            { word: "tired", related: ["drained", "depleted"] },
            { word: "reasonable", related: ["compliant", "suppressed"] }
          ],
          analytical_block: {
            emotional_tone: "guarded and depleted",
            agency_language: "positioning yourself as having to absorb what others leave undone",
            primary_theme: "Suppression of frustration in professional and personal interactions",
            trajectory: "flat",
            notable_absence: "any mention of what you actually wanted to happen"
          }
        };
      }
      
      if (mockRes) {
        this.lastRawResponse = JSON.stringify(mockRes, null, 2);
        this.lastUsage = { input_tokens: 380, output_tokens: 180, total_tokens: 560 };
        ApiUsageService.recordEvent({
          provider: 'claude',
          service: 'ai_inference_mock',
          endpoint: 'Anthropic.messages.create',
          statusCode: 200,
          success: true,
          latencyMs: 45,
          model: effectiveModel,
          inputTokens: 380,
          outputTokens: 180,
        });
        return mockRes as T;
      }
      throw new Error(`[ClaudeProvider Mock] Unsupported prompt template.`);
    }

    if (!effectiveKey) {
      throw new Error('[ClaudeProvider] Missing Claude API key. Please configure CLAUDE_API_KEY or ANTHROPIC_API_KEY in your environment variables.');
    }

    if (!this.client || this.apiKey !== effectiveKey) {
      this.apiKey = effectiveKey;
      this.client = new Anthropic({ apiKey: this.apiKey });
    }

    const candidateModels = [
      effectiveModel,
      'claude-sonnet-5',
      'claude-sonnet-4-5',
      'claude-3-7-sonnet-latest',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-latest',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-5-haiku-latest',
      'claude-3-5-haiku-20241022',
      'claude-3-haiku-20240307',
      'claude-3-sonnet-20240229'
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    let lastError: any = null;

    for (const selectedModel of candidateModels) {
      const callStart = Date.now();
      console.log(`[ClaudeProvider] Calling Anthropic API (${selectedModel})...`);

      try {
        const response = await this.client.messages.create({
          model: selectedModel,
          max_tokens: 4000,
          system: `${systemPrompt}\nYou must return a valid JSON object matching the requested schema. Output ONLY the JSON block. Do not output any conversational introductions, markdown formatting outside of a json codeblock, or explanation. Begin your response with '{' and end with '}'.`,
          messages: [
            { role: 'user', content: userContent }
          ]
        });

        const latencyMs = Date.now() - callStart;

        let rawText = '';
        for (const block of response.content) {
          if (block.type === 'text') {
            rawText += block.text;
          }
        }

        if (!rawText) {
          throw new Error('Claude API returned an empty text completion response.');
        }

        this.lastRawResponse = rawText;
        const inTok = response.usage?.input_tokens || 0;
        const outTok = response.usage?.output_tokens || 0;
        const cacheTok = (response.usage as any)?.cache_read_input_tokens || 0;

        this.lastUsage = {
          input_tokens: inTok,
          output_tokens: outTok,
          total_tokens: inTok + outTok,
          cache_tokens: cacheTok,
        };

        ApiUsageService.recordEvent({
          provider: 'claude',
          service: 'ai_inference',
          endpoint: 'Anthropic.messages.create',
          statusCode: 200,
          success: true,
          latencyMs,
          model: selectedModel,
          inputTokens: inTok,
          outputTokens: outTok,
          cacheTokens: cacheTok,
        });

        return extractJson<T>(rawText);
      } catch (error: any) {
        const latencyMs = Date.now() - callStart;
        const errorStr = error?.message || String(error);

        ApiUsageService.recordEvent({
          provider: 'claude',
          service: 'ai_inference',
          endpoint: 'Anthropic.messages.create',
          statusCode: error?.status || 500,
          success: false,
          latencyMs,
          model: selectedModel,
          errorCategory: error?.status === 429 ? 'RATE_LIMIT' : (error?.status === 404 ? 'NOT_FOUND' : 'API_ERROR'),
        });

        if (error?.status === 404 || errorStr.includes('404') || error?.error?.type === 'not_found_error') {
          console.warn(`[ClaudeProvider] Model ${selectedModel} returned 404 not found. Trying next candidate model...`);
          lastError = error;
          continue;
        }
        console.error('[ClaudeProvider] API request failed:', error);
        throw error;
      }
    }

    throw lastError || new Error('[ClaudeProvider] All candidate Claude models failed.');
  }

  async scoreEntry(content: string): Promise<ClarityScoreResponse> {
    const systemPrompt = `You are a clinical emotional insights engine. Analyze the provided journal entry and return a JSON object with:
{
  "clarityScore": number (0 to 100 representing cognitive clarity and emotional resolution, where 100 is high clarity/low fog),
  "sentiment": string (e.g. "depleted", "anxious", "resolving", "neutral", "reflective"),
  "stressIndicators": string[] (array of main emotional/cognitive stressors or keyword triggers identified in the text)
}`;
    return this.callClaude<ClarityScoreResponse>(systemPrompt, `Journal entry:\n"${content}"`);
  }

  async generateReflection(
    entryContent: string,
    context?: string,
    latestThread?: string,
    previousReflection?: string,
    useSimplifiedPrompt?: boolean
  ): Promise<ReflectionResponse> {
    let systemPrompt = '';

    if (useSimplifiedPrompt) {
      systemPrompt = `You are Ingress Within, a clinical emotional observation engine.
Write a simple, direct clinical observation (1-2 sentences) about the user's journal entry.
Speak directly to the user using "you" and "your".

INPUT CONTEXT:
- Personality summary: ${context || 'None'}

RULES:
1. Write 1-2 plain, conversational sentences (10 to 100 words total).
2. Address the user directly using "you".
3. Do NOT give advice, suggestions, or recommendations.
4. Do NOT use clinical diagnostic labels.
5. Ask exactly ONE simple question about their feelings.

Schema:
{
  "classification": "Flat" | "Open" | "Scattered",
  "reflection": "The direct conversational sentences observing the entry.",
  "closing_nudge": "Take care.",
  "closing_question": "One simple follow-up question.",
  "confidence": "medium",
  "themes": ["Reflection"],
  "vocabulary": ["journal"],
  "processing_notes": "Simplified fallback reflection."
}`;
    } else {
      systemPrompt = `You are Ingress Within, a clinical emotional observation engine.
Your task is to write a thoughtful observation on the user's latest journal entry.
Speak directly to the user using "you" and "your".

INPUT CONTEXT:
- Personality summary: ${context || 'None'}
- Latest Completed Thread: ${latestThread || 'None'}
- Previous Reflection (AVOID repeating its phrasing, themes, or question): ${previousReflection || 'None'}

RULES FOR THE OBSERVATION ("reflection"):
1. Write 2-3 plain, conversational sentences (strictly between 10 and 100 words total).
2. Point to one specific emotional shift, contradiction, strength, or avoidance in their writing. Go one layer deeper than what they wrote.
3. NEVER give advice, suggestions, or directives. Do NOT use phrases like: "you should", "try to", "consider", "remember to", "it is important to", "you need to", "make sure to", "suggest", "recommend", "you could", "try doing".
4. NEVER use clinical diagnostic labels. Do NOT use: "disorder", "diagnose", "clinical", "therapy", "therapist", "patient", "treatment", "depression", "anxiety", "bipolar", "ptsd", "adhd", "schiz".
5. Avoid template phrases or repetitive endings (e.g., do NOT end with "Sit with that", "Come back tomorrow", "Take a moment", or similar). Every reflection must feel completely unique to this entry.

RULES FOR THE CLOSING QUESTION ("closing_question"):
Ask exactly ONE thoughtful question that naturally follows their writing. It must make them face what they are keeping vague or avoiding, focusing on internal experience/feelings (not action).

RULES FOR THE CLOSING NUDGE ("closing_nudge"):
A personalized 1-2 sentence transition nudge. Make it organic, empathetic, and context-aware.

You must return a valid JSON object matching the requested schema. Do not output any markdown formatting (no \`\`\`json wrapper, no text before/after).

Schema:
{
  "classification": "Flat" | "Open" | "Scattered",
  "reflection": "The 2-3 plain conversational sentences observing the entry.",
  "closing_nudge": "Personalized transition nudge.",
  "closing_question": "Single question.",
  "confidence": "high" | "medium" | "low",
  "themes": ["2-4 themes"],
  "vocabulary": ["2-5 key emotion words from entry"],
  "processing_notes": "Technical framing notes."
}`;
    }

    return this.callClaude<ReflectionResponse>(systemPrompt, `Journal entry:\n"${entryContent}"`);
  }

  async generateWeeklySummary(entries: { content: string; created_at: string }[], personalitySummary?: string): Promise<WeeklySummaryResponse> {
    const systemPrompt = `STANDING CONTEXT — use to calibrate what you notice. Do not surface to the user. Do not reference it directly. Personality context for this user: ${personalitySummary || 'None'}
─────────────────────────────────────────────────────────
You are a clinical supervisor synthesizing a weekly journal summary for a user. You must speak directly to them in the second person ("you", "your"). Never refer to them as "the client", "the user", "the individual", or in the third person ("they", "he", "she"). Analyze the entries and return a JSON object with:
{
  "title": string (a short, evocative weekly summary title capturing the theme, e.g., "Composure vs. Suppression"),
  "body": string (a 2-3 sentence narrative summarizing their emotional landscape this week directly to them, e.g. "Your week showed..."),
  "why": string (a brief behavioral interpretation explaining the underlying pattern),
  "emos": [
    {
      "w": string (the focal emotion word, e.g. "fine", "tired", "frustrated"),
      "c": string (occurrence count, e.g. "×4", "×3"),
      "r": string[] (array of associated raw words or expressions showing up in their text)
    }
  ],
  "q": string (a weekly focal reflection question to prompt deeper writing in the upcoming week)
}`;
    const formattedEntries = entries.map((e, idx) => `[Entry ${idx + 1} (${e.created_at})]: ${e.content}`).join('\n\n');
    return this.callClaude<WeeklySummaryResponse>(systemPrompt, `Weekly entries:\n${formattedEntries}`);
  }

  async generateWeeklyReport(data: WeeklyReportInput): Promise<WeeklyReportResponse> {
    const systemPrompt = `You will receive:
- The entries written this week
- The top 3 most-used words/phrases this week and how many times each appeared
- Days skipped, if any
- Last week's top expression(s), if a previous week exists (null if this is week 1)

Return only valid JSON. No markdown, no backticks, no preamble. All fields must be present.

{
  "week_tone": "One sentence. Plain description of your week, not a diagnostic label. Speak directly to you. No binary framing (X vs Y). If nothing coheres across your week, describe that directly rather than forcing a single mood onto it.",
  "what_we_saw": "Write exactly TWO paragraphs separated by a double newline (\\n\\n). Paragraph 1: 2-4 sentences weaving specific facts from this week into a single cohesive narrative flow. NEVER list entries chronologically, and NEVER use day numbers, day labels, or specific days (e.g. do not say 'On one day you did X', 'On Day 2', 'first day'). Paragraph 2: exactly one realization (1-2 sentences) stating what the facts add up to, grounded in agency_language or a contradiction.",
  "carry_question": "2-3 sentences, not 1. First state the specific tension plainly, naming real details from your entries. Then ask the question directly to you. Must not restate candidate_quote in question form.",
  "candidate_quote": "One verbatim line from your entries, copied exactly as written including typos. Not the most emotional line. The one that accidentally told the truth. Pick throwaway lines, self-corrections, minimisations. If no strong candidate exists, pick the closest and add a trailing asterisk.",
  "since_last_week": {
    "last_week_words": [],
    "this_week_words": []
  },
  "emotion_clusters": [
    {
      "word": "exact word or short phrase from your writing this week — pick the most emotionally loaded one",
      "related": ["semantically adjacent word you did NOT write", "another related word not in your writing", "optional third"]
    }
  ],
  "analytical_block": {
    "emotional_tone": "dominant register across your week in 2-4 words",
    "agency_language": "how you position yourself relative to events",
    "primary_theme": "one thread most consistent across your entries. If none exists, say so.",
    "trajectory": "improving / declining / flat / volatile / unclear",
    "notable_absence": "what you didn't write about that your writing implies"
  }
}

CRITICAL constraint: You must speak directly to the user in the second person ('you', 'your', 'yourself') in ALL fields, including analytical_block (such as agency_language and notable_absence). Never use 'the user', 'the writer', 'the client', 'the person', 'they', 'them', 'their', 'he', 'she', or 'him/her' in any of the response fields. Every sentence must read as if you are speaking directly to them in a session.

For emotion_clusters:
- Pick exactly 3 words/phrases from the user's actual writing this week (not normalized versions, exact as written)
- For each, provide 2-3 semantically adjacent words that capture the same feeling but the user did NOT write
- Example: user wrote "tired" → related: ["drained", "depleted"]
- Example: user wrote "brain won't stop" → related: ["rumination", "intrusive thoughts"]
- Do NOT repeat the user's word in the related array
- Do NOT use clinical jargon in related words — plain words only`;

    const formattedEntries = data.entries.map((e, idx) => `Day ${e.cycle_day} (${e.created_at || 'Recent'}) Journal Entry:\n"${e.content}"`).join('\n\n');
    const topWords = data.vocabThisWeek.slice(0, 3).map(w => `"${w.word}" (frequency: ${w.frequency})`).join(', ');
    const skippedDaysInfo = data.weekly_stats.skipped_days > 0 
      ? `Days skipped: ${data.weekly_stats.skipped_day_numbers.map(d => `Day ${d}`).join(', ')}`
      : 'Days skipped: None';
    const lastWeekInfo = data.lastWeekTopExpressions 
      ? `Last week's top expressions: ${data.lastWeekTopExpressions.map(w => `"${w}"`).join(', ')}`
      : "Last week's top expressions: null (this is week 1)";

    const userContent = `User Weekly Data:
- Entries written this week:
${formattedEntries}

- Top most-used words/phrases this week:
${topWords || 'None'}

- Skipped Days:
${skippedDaysInfo}

- Previous Week Context:
${lastWeekInfo}`;

    return this.callClaude<WeeklyReportResponse>(systemPrompt, userContent);
  }

  async generateMonthlyReport(entries: { content: string; created_at: string }[]): Promise<MonthlyReportResponse> {
    const systemPrompt = `You are a clinical director compiling a Day 28 synthesis report for a user based on a month of journal entries. You must speak directly to them in the second person ("you", "your"). Never refer to them as "the client", "the user", "the individual", or in the third person ("they", "he", "she"). Return a JSON object with:
{
  "dimensions": [
    {
      "label": "Emotional intensity",
      "fill": string (percentage, e.g., "72%"),
      "val": string (e.g. "High", "Moderate", "Low"),
      "desc": string (brief narrative rationale),
      "color": "bg-[#E0A898]"
    },
    {
      "label": "Pattern rigidity",
      "fill": string (percentage, e.g., "80%"),
      "val": string (e.g. "Strong", "Moderate", "Fluid"),
      "desc": string (brief narrative rationale),
      "color": "bg-[#E0A898]"
    },
    {
      "label": "Self-agency",
      "fill": string (percentage, e.g., "32%"),
      "val": string (e.g. "Low", "Moderate", "High"),
      "desc": string (brief narrative rationale),
      "color": "bg-[#B8A8D4]"
    },
    {
      "label": "Distress trajectory",
      "fill": string (percentage, e.g., "55%"),
      "val": string (e.g. "Flat", "Improving", "Escalating"),
      "desc": string (brief narrative rationale),
      "color": "bg-[#8DBFB4]/70"
    }
  ],
  "insight": string (a monthly narrative summary integrating the findings and describing active coping behaviors and recommendations)
}`;
    
    const formattedEntries = entries.map((e, idx) => `[Day ${idx + 1} (${e.created_at})]: ${e.content}`).join('\n\n');
    return this.callClaude<MonthlyReportResponse>(systemPrompt, `Monthly entries:\n${formattedEntries}`);
  }

  async generateOceanSummary(entries: { content: string; created_at: string }[]): Promise<OceanSummaryResponse> {
    const systemPrompt = `You are a research psychologist performing an OCEAN (Big Five) personality analysis based on writing patterns. Return a JSON object with:
{
  "openness": number (0 to 100),
  "conscientiousness": number (0 to 100),
  "extraversion": number (0 to 100),
  "agreeableness": number (0 to 100),
  "neuroticism": number (0 to 100),
  "analysis": string (a comprehensive narrative analysis explaining how linguistic choices reflect these personality traits)
}`;
    const formattedEntries = entries.map((e, idx) => `[Entry ${idx + 1} (${e.created_at})]: ${e.content}`).join('\n\n');
    return this.callClaude<OceanSummaryResponse>(systemPrompt, `Client writings:\n${formattedEntries}`);
  }

  async generateExerciseInsight(
    stressorType: string,
    reactiveThought: string,
    reframedThought: string
  ): Promise<ExerciseInsightResponse> {
    const systemPrompt = `You are a cognitive behavioral therapist (CBT) assistant. Analyze this cognitive reframing exercise and return a JSON object with:
{
  "insight": string (a brief narrative identifying cognitive distortions—such as catastrophizing, black-and-white thinking, or emotional reasoning—present in the reactive thought, and assessing the quality of the reframed thought),
  "recommendations": string[] (array of 2-3 actionable advice items for maintaining this reframed state)
}`;
    const userContent = `Stressor Type: ${stressorType}\nReactive Thought: ${reactiveThought}\nReframed Thought: ${reframedThought}`;
    return this.callClaude<ExerciseInsightResponse>(systemPrompt, userContent);
  }

  async detectCrisis(content: string): Promise<CrisisDetectionResponse> {
    const systemPrompt = `You are a psychiatric crisis detection engine. Analyze the provided journal entry and evaluate if the client shows signs of active, imminent crisis, self-harm intentions, or suicide risk.
Return ONLY a valid JSON object matching the requested schema. Do NOT wrap the JSON response in any markdown code block formatting (do not use \`\`\`). Do not include any conversational preambles, explanations, or trailing commentary. Your output must start with '{' and end with '}'.

Schema:
{
  "isCrisis": boolean,
  "reason": string (if isCrisis is true, explain briefly; otherwise leave empty)
}`;
    return this.callClaude<CrisisDetectionResponse>(systemPrompt, `Journal entry:\n"${content}"`);
  }

  async scoreEntryDimensions(
    reflectionText?: string | null,
    newEntryText?: string | null,
    personalityContext?: string | null
  ): Promise<EntryDimensionsScoreResponse> {
    const systemPrompt = `You are the Ingress Within psychometric scoring engine. Your task is to analyze a user's daily journal entry and score it on three dimensions: EI (Emotional Intensity), PR (Pattern Rigidity), and SA (Self-Agency) on a scale of 1.0 to 10.0 based on the official Ingress Within Scoring Rubric v1.

Personality context for this user: "${personalityContext || 'None'}"

### SCORING INSTRUCTIONS FOR EACH DIMENSION

1. EI — Emotional Intensity (Measures the level of emotional charge present in the entry. Intensity only, not valence):
   - High EI (7–10): Intense emotion words (devastated, terrified, furious, overwhelmed, desperate), physical sensations (chest tight, heart racing, felt sick), emotional flooding, catastrophic/absolutist framing.
     * Anchor 7-8: Strong emotion, physical sensation or flooding beginning.
     * Anchor 9-10: Intense flooding, multiple strong emotions, catastrophic language, or severe expressions of hopelessness/helplessness (e.g., "I cannot do this anymore", "Everything feels impossible").
   - Mid EI (4–6): Moderate emotion words (frustrated, anxious, sad, pleased), contained, mix of emotional and factual, named but not dwelt on.
     * Anchor 4-5: Moderate emotion present and named. Contained.
     * Anchor 6: Emotion is the focus of parts of the entry, more than one feeling.
   - Low EI (1–3): Flat or neutral language, purely factual/descriptive log of events.
     * Anchor 1-2: No emotional signal. Purely factual or intellectual.
     * Anchor 3: Minimal emotion. One brief passing reference.
   - Edge Case: Numbness/feeling nothing is a suppression signal. Score 4–5.

2. PR — Pattern Rigidity (Measures how stuck or fixed the user’s thinking patterns are. Structure of thinking, not the content):
   - High PR (7–10): "Always/never" language, predetermined conclusions, no alternative framings considered, consistent blame (always self, always others, always circumstances), closed loop reasoning.
     * Anchor 7-8: Fixed lens, predetermined conclusion, no alternatives.
     * Anchor 9-10: Completely closed loop, universal generalizations, no self-questioning.
   - Mid PR (4–6): Some fixed language but moments of openness/awareness, one clear pattern but user shows awareness of it, partial alternative framings.
     * Anchor 4-5: One pattern present, some awareness/flexibility.
     * Anchor 6: Pattern dominant, alternative attempted but not held.
   - Low PR (1–3): Multiple framings held simultaneously, genuine uncertainty, openness to being wrong, questions rather than conclusions.
     * Anchor 1-2: No detectable pattern rigidity. Genuinely open thinking.
     * Anchor 3: Slight tendency toward one lens but easily questioned.
   - Edge Case: Awareness of a pattern reduces PR score (score 4–5 rather than 7–8).

3. SA — Self-Agency (Measures the degree to which the user positions themselves as an active author of their experience. Not positivity/blame):
   - High SA (7–10): Active constructions ("I decided", "I chose"), self-assigned causation even for negative outcomes, owns role in patterns, intention language.
     * Anchor 7-8: Predominantly active, owns role, reflects on choices.
     * Anchor 9-10: Fully active authorship throughout, strong self-assigned causation and intention.
   - Mid SA (4–6): Mix of active and passive, "I try to" constructions, active in low-stakes/passive in high-stakes.
     * Anchor 4-5: Mix of passive and active, partial ownership.
     * Anchor 6: More active than passive, self-awareness present but not consistent.
   - Low SA (1–3): Passive constructions ("it happened", "things got out of hand"), external attribution for most outcomes, complaint loops, no choice or intention.
     * Anchor 1-2: Fully passive, no authorship language.
     * Anchor 3: Almost entirely passive, one brief moment of self-reference.
   - Edge Cases:
     * Grief/trauma/external crisis: score toward mid (4–5) and flag context, do not score low SA purely because of circumstances.
     * Explicit powerlessness statement: score 2–3.
     * Self-criticism is not self-agency: punitive self-blame is low SA and high PR.

4. RISK LANGUAGE DETECTION (Signal 3):
   - Evaluate if the user's text contains explicit statements, words, or phrases expressing intent to die, end their life, harm themselves, or harm a specific other person. This must be an explicit statement (e.g., "I want to die", "I want to end my life", "I want to kill myself").
   - If detected: set "riskLanguageDetected" to true, and set "riskLanguageQuote" to the exact verbatim sentence or phrase from the text that triggered the match.
   - If not detected: set "riskLanguageDetected" to false, and set "riskLanguageQuote" to null.

### GENERAL RULES & EDGE CASES
- Score what is in the text. Do not infer what is not said. Length is not a signal.
- Score language, not events (describing crisis in flat language scores low EI).
- Average the halves if register shifts mid-entry (arc scoring).
- When uncertain, choose the lower score.
- Short entries (1–2 sentences): score conservatively toward midpoint (4–6) on all dimensions unless unambiguous. Set confidenceFlag to true.
- Score reflection and new entry INDEPENDENTLY. Do not blend them.

### RESPONSE FORMAT
Return ONLY a valid JSON object matching this schema. Do NOT wrap the JSON response in any markdown code block formatting (do not use \`\`\`json or \`\`\`). Do not include any conversational preambles, explanations, or trailing commentary. Your output must start with '{' and end with '}'.

Schema:
{
  "reflection": {
    "ei": number (1.0 to 10.0),
    "pr": number (1.0 to 10.0),
    "sa": number (1.0 to 10.0)
  } | null,
  "newEntry": {
    "ei": number (1.0 to 10.0),
    "pr": number (1.0 to 10.0),
    "sa": number (1.0 to 10.0)
  } | null,
  "confidenceFlag": boolean,
  "confidenceReason": string (brief note),
  "riskLanguageDetected": boolean,
  "riskLanguageQuote": string | null,
  "arcScoringApplied": boolean
}`;

    const userContent = `Text to score:
Reflection Text to score: ${reflectionText ? `"${reflectionText}"` : 'None'}
New Entry Text to score: ${newEntryText ? `"${newEntryText}"` : 'None'}`;

    return this.callClaude<EntryDimensionsScoreResponse>(systemPrompt, userContent);
  }

  async generatePersonalitySummary(scores: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  }): Promise<string> {
    const systemPrompt = `You are a personality analysis assistant.
AI ANALYSIS GOAL: You are reading the user's OCEAN personality assessment scores on a scale of 1–5 where 5 is highest.

Write 2–3 plain sentences directly addressing the user (using "you", "your", "yourself") describing how you tend to process your inner life. Do NOT use third-person phrasing like "this person", "they", or "their". Do not use OCEAN terminology or clinical jargon. Do not mention scores or numbers.
End with one final sentence that begins: This space is designed for exactly that.

Be accurate. Be plain. Do not be overly warm or reassuring. Just describe clearly what you observe.

Return a valid JSON object matching the requested schema:
{
  "summary": "The generated personality summary string addressed directly to the user as you/your."
}`;

    const userContent = `Openness: ${scores.openness} | Conscientiousness: ${scores.conscientiousness} | Extraversion: ${scores.extraversion} | Agreeableness: ${scores.agreeableness} | Neuroticism: ${scores.neuroticism}`;

    const result = await this.callClaude<{ summary: string }>(systemPrompt, userContent);
    return result.summary;
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
    return this.callClaude<{
      expressions: {
        word: string;
        normalized: string;
        semantic_meaning: string;
        context: string;
        confidence: number;
      }[];
    }>(systemPrompt, `User text:\n"${entryContent}"`);
  }

  async extractConcepts(entryContent: string): Promise<{ concepts: { concept: string; confidence: number }[] }> {
    const systemPrompt = `You are an AI assistant designed to identify high-level emotional concepts and psychological dynamics implied in a journal entry, beyond the literal words.
    
Examples:
- "I keep carrying everyone's expectations." -> Responsibility, Pressure, Burden
- "I don't know what to do next." -> Confusion, Anxiety, Uncertainty
- "I just want to hide in bed." -> Avoidance, Exhaustion, Depression

Identify 1-4 key emotional concepts from the journal entry. Assign a confidence score between 0.0 and 1.0 to each.

Return a valid JSON object matching the requested schema:
{
  "concepts": [
    { "concept": "Responsibility", "confidence": 0.95 }
  ]
}`;
    return this.callClaude<{ concepts: { concept: string; confidence: number }[] }>(systemPrompt, `Journal entry:\n"${entryContent}"`);
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
    const systemPrompt = `You are the emotional-vocabulary engine inside Ingress Within. The app reflects a person's own word choices back to them without therapy-speak, jargon, or diagnosis.
Your task: for each of the user's top emotion words, surface up to 3 closely related words that are more specific or nuanced than the word they used, and write one short insight line that gently distinguishes the shades of meaning between the used word and the related words, ending on a quiet, reflective note (not an instruction, not advice).

Style rules, matching examples already in the app:
- "Tired is about energy. Exhausted implies recovery needed. Depleted implies something was taken. Worth sitting with which one is actually true."
- "\\"Fine\\" almost always appears when describing yourself — never about situations or other people. That pattern is worth noticing."
- "Frustrated implies something can still change. Resentful implies it already has. The distinction matters."
Insight lines are 1–2 sentences, under ~35 words, plain language, second person or observational, never clinical.

Return a valid JSON object matching the requested schema:
{
  "clusters": [
    {
      "cluster_name": "hopeful",
      "words": ["optimistic", "encouraged", "confident"],
      "description": "Hopeful implies looking forward to something. Optimistic is a general outlook, while confident implies assurance. Notice which one you reach for when uncertainty rises.",
      "confidence": 0.95
    }
  ]
}`;
    const userContent = JSON.stringify(words, null, 2);
    return this.callClaude<{
      clusters: {
        cluster_name: string;
        description: string;
        confidence: number;
        words: string[];
      }[];
    }>(systemPrompt, `Input words:\n${userContent}`);
  }

  async scoreEmotionalRelevance(words: string[], entryContent: string): Promise<{ validatedWords: { word: string; is_emotional: boolean; category?: 'emotional' | 'theme' | 'general'; score: number }[] }> {
    const systemPrompt = `You are a psychological, emotional, and semantic analysis assistant.
    
TASK:
Analyze the provided list of candidate words extracted from a user's journal entry. Classify each word into one of three distinct categories based on its contextual usage in the text:

1. "emotional" (Emotional Vocabulary): Words that directly express feelings, emotional states, psychological experiences, emotional regulation, distress, hope, fear, gratitude, loneliness, confidence, uncertainty, etc.
   - This category must be highly selective. Only include emotionally meaningful words.
   - Avoid general action or content words (e.g., "focus", "do", "think", "go").
   - When uncertain, prefer excluding a word (classify as "general" or "theme") rather than including it as "emotional".

2. "theme" (Personal Themes): Recurring goal-, work-, identity-, growth-, productivity-, relationship-, learning-, or value-oriented terms (e.g., "career", "boundary", "routine", "priority", "improve", "family").

3. "general" (General/Other): Factual, descriptive, or general words with no significant emotional or theme relevance in this context (e.g., "office", "walk", "meeting", "wrote").

For each word, return:
- "word": The input word string.
- "is_emotional": boolean (true if classified as "emotional", false otherwise).
- "category": "emotional" | "theme" | "general".
- "score": number between 0.0 and 1.0 representing confidence in this classification.

Return a valid JSON object matching the requested schema:
{
  "validatedWords": [
    {
      "word": "tired",
      "is_emotional": true,
      "category": "emotional",
      "score": 0.95
    }
  ]
}`;
    const userContent = `Candidate Words: ${JSON.stringify(words)}\n\nJournal Entry Content:\n"${entryContent}"`;
    return this.callClaude<{ validatedWords: { word: string; is_emotional: boolean; category?: 'emotional' | 'theme' | 'general'; score: number }[] }>(systemPrompt, userContent);
  }

  async callRaw(prompt: string): Promise<string> {
    this.lastSystemPrompt = "Raw Completion";
    this.lastUserContent = prompt;

    if (!this.apiKey || this.apiKey.startsWith('mock_') || this.apiKey === 'sk-ant-development-mock-key-replace-me') {
      console.warn(`[ClaudeProvider] Running with mock key. Simulating callRaw response.`);
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
      if (prompt.includes('COST-BENEFIT AUDIT')) {
        if (prompt.includes('OVERALL SYNTHESIS')) {
          this.lastRawResponse = JSON.stringify({
            overall_reflection: "Across these patterns, there is a consistent theme of protective self-containment and careful pacing to maintain emotional safety."
          });
          return this.lastRawResponse;
        }
        this.lastRawResponse = JSON.stringify({
          observation: "Holding onto this pattern appears to offer a sense of predictability and protection, though it may also come with notable emotional or energy trade-offs in daily interactions.",
          protectionMechanism: "The pattern seems to function as an adaptive buffer to guard against vulnerability or unexpected friction.",
          relationship: "There appears to be an active balance between the safety this response preserves and the ongoing effort required to sustain it."
        });
        return this.lastRawResponse;
      }
      if (prompt.includes('TRIGGER MAPPING')) {
        this.lastRawResponse = `ANALYSIS:
When routine friction or unexpected inquiries occur, you seem to notice an immediate shift toward defensive tension or withdrawing to avoid exposure. Your synthesis captures the tendency to brace for criticism, though it may also be worth noticing how quickly the impulse to protect yourself takes precedence before the full context is clear.

{"worth_sitting_with": [{"label": "Meeting Defensiveness", "note": "In this situation, your reaction shifted quickly toward self-protection compared to moments where you stepped back. You described wanting to avoid feeling judged or tested in front of peers. In daily interactions, this can look like preemptive armor against routine inquiries. Worth noticing if a routine question is actually evaluating you, or simply asking for information."}]}`;
        return this.lastRawResponse;
      }
      return "[]";
    }

    if (!this.client) {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }

    const candidateModels = [
      this.getEffectiveModel(),
      'claude-sonnet-5',
      'claude-sonnet-4-5',
      'claude-3-7-sonnet-latest',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-latest',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-5-haiku-latest',
      'claude-3-5-haiku-20241022',
      'claude-3-haiku-20240307',
      'claude-3-sonnet-20240229'
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    let lastError: any = null;

    for (const selectedModel of candidateModels) {
      try {
        const response = await this.client.messages.create({
          model: selectedModel,
          max_tokens: 4000,
          messages: [
            { role: 'user', content: prompt }
          ]
        });

        let rawText = '';
        for (const block of response.content) {
          if (block.type === 'text') {
            rawText += block.text;
          }
        }

        if (!rawText) {
          throw new Error('Claude API returned an empty completion response.');
        }

        this.lastRawResponse = rawText;
        this.lastUsage = {
          input_tokens: response.usage?.input_tokens || 0,
          output_tokens: response.usage?.output_tokens || 0,
          total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        };

        return rawText;
      } catch (error: any) {
        const errorStr = error?.message || String(error);
        if (error?.status === 404 || errorStr.includes('404') || error?.error?.type === 'not_found_error') {
          console.warn(`[ClaudeProvider] callRaw model ${selectedModel} returned 404 not found. Trying next candidate model...`);
          lastError = error;
          continue;
        }
        console.error('[ClaudeProvider] callRaw failed:', error);
        throw error;
      }
    }

    throw lastError || new Error('[ClaudeProvider] All candidate Claude models failed for callRaw.');
  }
}
