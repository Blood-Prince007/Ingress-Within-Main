/**
 * INGRESS WITHIN — AI MODEL PRICING & COST ESTIMATOR
 * 
 * Provides model-specific rates in minor units (paise, 1 INR = 100 paise).
 * Uses standard USD -> INR peg (default: 86.00 INR/USD) converted to integer paise.
 * 
 * Rates are stored per 1,000,000 tokens (MTok).
 * Pricing calculation uses integer arithmetic (BigInt / Math.round) with zero floating-point drift.
 */

export interface ModelPricingDefinition {
  provider: 'claude' | 'groq' | 'gemini' | 'synthesizer';
  model: string;
  // Rates in integer paise per 1M tokens
  inputPaisePerMTok: number;
  outputPaisePerMTok: number;
  cacheReadPaisePerMTok?: number;
  cacheWritePaisePerMTok?: number;
  currency: 'INR';
}

// 1 USD = 86 INR = 8,600 paise
const USD_TO_PAISE = 8600;

export const AI_MODEL_PRICING: Record<string, ModelPricingDefinition> = {
  // Claude 3.5 Sonnet: $3.00 / MTok in, $15.00 / MTok out
  'claude-3-5-sonnet-20241022': {
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
    inputPaisePerMTok: 3.0 * USD_TO_PAISE,       // 25,800 paise
    outputPaisePerMTok: 15.0 * USD_TO_PAISE,     // 129,000 paise
    cacheReadPaisePerMTok: 0.3 * USD_TO_PAISE,   // 2,580 paise
    cacheWritePaisePerMTok: 3.75 * USD_TO_PAISE, // 32,250 paise
    currency: 'INR',
  },
  'claude-3-5-sonnet-latest': {
    provider: 'claude',
    model: 'claude-3-5-sonnet-latest',
    inputPaisePerMTok: 3.0 * USD_TO_PAISE,
    outputPaisePerMTok: 15.0 * USD_TO_PAISE,
    cacheReadPaisePerMTok: 0.3 * USD_TO_PAISE,
    cacheWritePaisePerMTok: 3.75 * USD_TO_PAISE,
    currency: 'INR',
  },
  'claude-sonnet-5': {
    provider: 'claude',
    model: 'claude-sonnet-5',
    inputPaisePerMTok: 3.0 * USD_TO_PAISE,
    outputPaisePerMTok: 15.0 * USD_TO_PAISE,
    currency: 'INR',
  },
  // Claude 3.5 Haiku: $0.80 / MTok in, $4.00 / MTok out
  'claude-3-5-haiku-20241022': {
    provider: 'claude',
    model: 'claude-3-5-haiku-20241022',
    inputPaisePerMTok: 0.8 * USD_TO_PAISE,       // 6,880 paise
    outputPaisePerMTok: 4.0 * USD_TO_PAISE,      // 34,400 paise
    currency: 'INR',
  },
  // Groq Llama 3.3 70B: $0.59 / MTok in, $0.79 / MTok out
  'llama-3.3-70b-versatile': {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    inputPaisePerMTok: 0.59 * USD_TO_PAISE,      // 5,074 paise
    outputPaisePerMTok: 0.79 * USD_TO_PAISE,     // 6,794 paise
    currency: 'INR',
  },
  'llama-3.1-8b-instant': {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    inputPaisePerMTok: 0.05 * USD_TO_PAISE,      // 430 paise
    outputPaisePerMTok: 0.08 * USD_TO_PAISE,     // 688 paise
    currency: 'INR',
  },
  // Gemini 1.5 Flash: $0.075 / MTok in, $0.30 / MTok out
  'gemini-1.5-flash': {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    inputPaisePerMTok: 0.075 * USD_TO_PAISE,     // 645 paise
    outputPaisePerMTok: 0.30 * USD_TO_PAISE,     // 2,580 paise
    currency: 'INR',
  },
  'gemini-2.0-flash': {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    inputPaisePerMTok: 0.10 * USD_TO_PAISE,
    outputPaisePerMTok: 0.40 * USD_TO_PAISE,
    currency: 'INR',
  },
  // Local synthesizer: ₹0
  'synthesizer': {
    provider: 'synthesizer',
    model: 'synthesizer',
    inputPaisePerMTok: 0,
    outputPaisePerMTok: 0,
    currency: 'INR',
  },
};

/**
 * Calculates estimated AI cost in integer paise with zero floating-point arithmetic.
 */
export function calculateEstimatedAICostPaise(params: {
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  cacheTokens?: number | null;
}): number {
  if (!params.model) return 0;
  
  const pricing = AI_MODEL_PRICING[params.model];
  if (!pricing) return 0; // Unknown model: do not invent costs

  const inTok = BigInt(Math.max(0, params.inputTokens || 0));
  const outTok = BigInt(Math.max(0, params.outputTokens || 0));
  const cacheTok = BigInt(Math.max(0, params.cacheTokens || 0));

  const inRate = BigInt(Math.round(pricing.inputPaisePerMTok));
  const outRate = BigInt(Math.round(pricing.outputPaisePerMTok));
  const cacheRate = BigInt(Math.round(pricing.cacheReadPaisePerMTok || 0));

  const MTOK = BigInt(1_000_000);

  // Cost = (tokens * rate) / 1,000,000
  const inCost = (inTok * inRate) / MTOK;
  const outCost = (outTok * outRate) / MTOK;
  const cacheCost = (cacheTok * cacheRate) / MTOK;

  return Number(inCost + outCost + cacheCost);
}
