import { traced, type TraceContext } from '../telemetry/trace.js';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

interface LLMOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  jsonMode?: boolean;
}

export async function llm(ctx: TraceContext, operation: string, options: LLMOptions): Promise<string> {
  return traced(ctx, 'openrouter', operation, options.prompt.substring(0, 200), async () => {
    const res = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        messages: [
          ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: options.prompt }
        ],
        max_tokens: options.maxTokens ?? 10000,
        ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {})
      }),
      signal: AbortSignal.timeout(60000)
    });
    const data = await res.json() as any;
    if (data.error) throw new Error(`OpenRouter error: ${data.error.message ?? JSON.stringify(data.error)}`);
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      const reason = data.choices?.[0]?.finish_reason ?? 'unknown';
      throw new Error(`Empty LLM response (finish_reason: ${reason})`);
    }
    return content;
  });
}

async function llmWithRetry(ctx: TraceContext, operation: string, options: LLMOptions, retries = 1): Promise<string> {
  try {
    return await llm(ctx, operation, options);
  } catch (err: any) {
    if (retries > 0 && err.message.includes('Empty LLM response')) {
      return llmWithRetry(ctx, operation, options, retries - 1);
    }
    throw err;
  }
}

export async function narrativize(
  ctx: TraceContext,
  widgetType: string,
  businessType: string,
  address: string,
  data: any
): Promise<string> {
  // Trim large arrays to keep prompt within reason
  const trimmedData = { ...data };
  if (trimmedData.nearbyMeters) trimmedData.nearbyMeters = trimmedData.nearbyMeters.slice(0, 3);
  if (trimmedData.crimeByCategory) trimmedData.crimeByCategory = trimmedData.crimeByCategory.slice(0, 5);
  if (trimmedData.top311Services) trimmedData.top311Services = trimmedData.top311Services.slice(0, 5);
  if (trimmedData.competitors) trimmedData.competitors = trimmedData.competitors.slice(0, 5);
  if (trimmedData.similarProjects) trimmedData.similarProjects = trimmedData.similarProjects.slice(0, 3);

  try {
    return await llmWithRetry(ctx, `narrative:${widgetType}`, {
      systemPrompt: `You write single widget labels for a business location assessment tool. Write 1-3 sentences in plain conversational English. Be specific — use actual numbers, names, and comparisons. Never use city jargon, code references, or acronyms. Translate everything into what it means for the user's business.`,
      prompt: `Widget: ${widgetType}\nBusiness: ${businessType}\nLocation: ${address}\nData: ${JSON.stringify(trimmedData)}\n\nWrite 1-3 sentences.`,
      maxTokens: 10000
    });
  } catch (err: any) {
    console.error(`Narrative generation failed for ${widgetType}:`, err.message);
    return '';
  }
}

export async function llmJSON<T>(
  ctx: TraceContext,
  operation: string,
  prompt: string,
  systemPrompt?: string
): Promise<T> {
  const result = await llmWithRetry(ctx, operation, { prompt, systemPrompt, jsonMode: true, maxTokens: 10000 });
  return JSON.parse(result.replace(/```json|```/g, '').trim());
}
