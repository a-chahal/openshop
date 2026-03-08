import { createTrace } from '../telemetry/trace.js';
import type { TraceContext } from '../telemetry/trace.js';
import type { DashboardResponse, StructuredSynthesis, FollowUpQuestion, ToolResult, ZoningData, CompetitionData, FootTrafficData, PermitData, NeighborhoodData } from '../types/index.js';
import { geocode, getCommunityPlan } from '../data/arcgis.js';
import { mapBusinessType } from './business-mapper.js';
import { llmJSON, llm } from './client.js';
import { checkZoning } from '../tools/checkZoning.js';
import { competitiveLandscape } from '../tools/competitiveLandscape.js';
import { footTraffic } from '../tools/footTraffic.js';
import { permitRoadmap } from '../tools/permitRoadmap.js';
import { neighborhoodProfile } from '../tools/neighborhoodProfile.js';

export async function orchestrate(businessType: string, address: string): Promise<DashboardResponse> {
  const ctx = createTrace(address, businessType);

  // Phase 1: Geocode + business mapping (parallel)
  const [geo, mapping] = await Promise.all([
    geocode(ctx, address),
    mapBusinessType(ctx, businessType)
  ]);

  const community = await getCommunityPlan(ctx, geo.lat, geo.lng);
  const communityName = community.cpName;

  // Phase 2: Zoning (depends on geocode + mapping)
  const zoningResult = await checkZoning(ctx, address, businessType, geo.lat, geo.lng, communityName, mapping);

  // Phase 3: Feasibility tools + permits (parallel)
  const results = await Promise.allSettled([
    competitiveLandscape(ctx, geo.lat, geo.lng, mapping.naicsCodes, 0.5, businessType, address),
    footTraffic(ctx, geo.lat, geo.lng, 0.3, businessType, address),
    neighborhoodProfile(ctx, geo.lat, geo.lng, communityName, businessType, address),
    permitRoadmap(ctx, geo.lat, geo.lng, communityName, [businessType], businessType, address)
  ]);

  const competition = results[0].status === 'fulfilled' ? results[0].value : null;
  const traffic = results[1].status === 'fulfilled' ? results[1].value : null;
  const hood = results[2].status === 'fulfilled' ? results[2].value : null;
  const permits = results[3].status === 'fulfilled' ? results[3].value : null;

  // Phase 4: Structured synthesis + hardcoded refinement questions
  const synthesis = await generateStructuredSynthesis(ctx, businessType, address, {
    zoning: zoningResult, competition, traffic, hood, permits
  });
  const followUps = getRefinementQuestions();

  const totalDuration = Date.now() - ctx.startTime;
  console.log(`\nOrchestration complete in ${totalDuration}ms\n`);

  return {
    geocoded: { lat: geo.lat, lng: geo.lng },
    communityPlan: communityName,
    zoneName: zoningResult.data.zoneName,
    zoning: zoningResult,
    competition,
    footTraffic: traffic,
    neighborhood: hood,
    permits: permits!,
    synthesis,
    questions: followUps,
    traceId: ctx.traceId
  };
}

export async function generateStructuredSynthesis(
  ctx: TraceContext,
  businessType: string,
  address: string,
  allResults: {
    zoning: ToolResult<ZoningData>;
    competition: ToolResult<CompetitionData> | null;
    traffic: ToolResult<FootTrafficData> | null;
    hood: ToolResult<NeighborhoodData> | null;
    permits: ToolResult<PermitData> | null;
  }
): Promise<StructuredSynthesis> {
  try {
    return await llmJSON<StructuredSynthesis>(ctx, 'structuredSynthesis', `
Analyze this business location data and produce a structured assessment.

Business: ${businessType}
Address: ${address}

Zoning: ${JSON.stringify(allResults.zoning.data)}
Competition: ${allResults.competition ? JSON.stringify(allResults.competition.data) : 'No data'}
Foot Traffic: ${allResults.traffic ? JSON.stringify(allResults.traffic.data) : 'No data'}
Neighborhood: ${allResults.hood ? JSON.stringify(allResults.hood.data) : 'No data'}
Permits: ${allResults.permits ? JSON.stringify(allResults.permits.data) : 'No data'}

Return JSON matching this exact schema:
{
  "possibleVerdict": "yes" | "conditional" | "no",
  "possibleSummary": "One sentence about whether this business is legally allowed here",
  "feasibilityScore": 0-100,
  "feasibilityFactors": [
    { "factor": "Competition", "signal": "positive" | "neutral" | "negative", "detail": "One sentence" },
    { "factor": "Foot Traffic", "signal": "...", "detail": "..." },
    { "factor": "Safety", "signal": "...", "detail": "..." },
    { "factor": "Infrastructure", "signal": "...", "detail": "..." }
  ],
  "nextSteps": [
    { "step": "Action item", "priority": "required" | "recommended" | "optional", "estimatedDays": number_or_null }
  ],
  "openQuestions": ["Question that would change the assessment"],
  "overallGlowColor": "green" | "amber" | "red"
}

Rules:
- possibleVerdict: "yes" if zoning permits it outright, "conditional" if needs CUP/variance, "no" if prohibited
- feasibilityScore: 0-100 overall viability score based on all factors
- feasibilityFactors: 3-5 factors, each with a signal and one-sentence detail using real numbers
- nextSteps: 3-6 concrete action items ordered by priority, with estimated days where known
- openQuestions: 0-3 questions whose answers would materially change the recommendation
- overallGlowColor: "green" if score >= 70, "amber" if 40-69, "red" if < 40
- Use plain English, no jargon, no acronyms
- Be specific with numbers from the data

Return ONLY valid JSON.`,
      'You produce structured business location assessments. Return only valid JSON matching the schema exactly.');
  } catch (err: any) {
    console.error('Structured synthesis failed:', err.message);
    // Fallback synthesis
    const isPermitted = allResults.zoning.data.designation === 'P';
    return {
      possibleVerdict: isPermitted ? 'yes' : 'conditional',
      possibleSummary: allResults.zoning.data.verdict || 'Zoning analysis complete.',
      feasibilityScore: 50,
      feasibilityFactors: [],
      nextSteps: [{ step: 'Consult with the city planning department', priority: 'required' }],
      openQuestions: [],
      overallGlowColor: isPermitted ? 'green' : 'amber'
    };
  }
}

// Hardcoded refinement questions — each answer directly adjusts the synthesis
export const REFINEMENT_QUESTIONS: FollowUpQuestion[] = [
  {
    id: 'alcohol',
    question: 'Will your business serve or sell alcohol?',
    inputType: 'select',
    options: ['No alcohol', 'Beer & wine only', 'Full bar / spirits'],
  },
  {
    id: 'budget',
    question: "What's your estimated startup budget?",
    inputType: 'select',
    options: ['Under $50k', '$50k – $150k', '$150k – $500k', 'Over $500k'],
  },
  {
    id: 'hours',
    question: 'What will your primary hours of operation be?',
    inputType: 'select',
    options: ['Morning (6am–2pm)', 'Daytime (8am–6pm)', 'Evening & night (4pm–12am)', 'Extended hours (6am–12am)'],
  },
];

export function getRefinementQuestions(): FollowUpQuestion[] {
  return REFINEMENT_QUESTIONS;
}

// Regenerate synthesis incorporating user answers
export async function refineSynthesis(
  ctx: TraceContext,
  businessType: string,
  address: string,
  currentSynthesis: StructuredSynthesis,
  allAnswers: Record<string, string>,
  toolSummary: {
    zoneName: string;
    verdict: string;
    competitorCount: number;
    survivalRate: number | null;
    trafficPct: number | null;
    medianPermitDays: number | null;
    violentCrimeRate: number | null;
  }
): Promise<{ message: string; synthesis: StructuredSynthesis }> {
  const answersText = Object.entries(allAnswers)
    .map(([id, answer]) => {
      const q = REFINEMENT_QUESTIONS.find(q => q.id === id);
      return `Q: ${q?.question ?? id}\nA: ${answer}`;
    })
    .join('\n\n');

  const synthesis = await llmJSON<StructuredSynthesis>(ctx, 'refineSynthesis', `
You are refining a business location assessment based on new information from the owner.

Business: ${businessType}
Address: ${address}

Location data summary:
- Zone: ${toolSummary.zoneName} — ${toolSummary.verdict}
- Competitors nearby: ${toolSummary.competitorCount}
- Business survival rate: ${toolSummary.survivalRate !== null ? toolSummary.survivalRate + '%' : 'N/A'}
- Foot traffic vs citywide: ${toolSummary.trafficPct !== null ? toolSummary.trafficPct + '%' : 'N/A'}
- Median permit days: ${toolSummary.medianPermitDays ?? 'N/A'}
- Violent crime rate: ${toolSummary.violentCrimeRate !== null ? toolSummary.violentCrimeRate + '%' : 'N/A'}

Previous assessment:
${JSON.stringify(currentSynthesis)}

New information from the business owner:
${answersText}

IMPORTANT — How answers affect the assessment:

ALCOHOL:
- "No alcohol" → no change to zoning, no liquor license step needed
- "Beer & wine only" → may need a Type 41 ABC license (~$500, 60-90 days), check if zone allows
- "Full bar / spirits" → likely needs Conditional Use Permit if zone says "permitted" for food, add CUP step (90-180 days), Type 47/48 ABC license, raises permit timeline significantly, could change verdict from "yes" to "conditional"

BUDGET:
- "Under $50k" → tight budget limits build-out, may need to find turnkey space, affects feasibility score negatively if area has high competition / high rent expectations, add "seek SBA microloan" to next steps
- "$50k – $150k" → moderate budget, reasonable for most small food/retail, neutral
- "$150k – $500k" → comfortable budget, can afford build-out and first-year runway, positive signal
- "Over $500k" → strong position, can handle delays/permits/build-out, positive factor

HOURS:
- "Morning (6am–2pm)" → parking meter data less relevant (meters often start 8am), reduces safety concern (daytime only), less competition overlap with evening restaurants
- "Daytime (8am–6pm)" → standard hours, foot traffic data directly applicable
- "Evening & night (4pm–12am)" → safety data becomes more important, parking meters less relevant, may need additional security considerations, check if zone has noise/hours restrictions
- "Extended hours (6am–12am)" → maximizes foot traffic capture, but raises operational costs, safety at night relevant

Regenerate the FULL assessment JSON with these adjustments. Change specific numbers — adjust feasibilityScore up or down by 5-15 points based on answers, add/remove/modify factors, add specific next steps for alcohol licensing or budget constraints, adjust verdict if alcohol changes zoning status.

Return JSON matching this exact schema:
{
  "possibleVerdict": "yes" | "conditional" | "no",
  "possibleSummary": "One sentence — mention alcohol/budget/hours impact if relevant",
  "feasibilityScore": 0-100,
  "feasibilityFactors": [
    { "factor": "Competition", "signal": "positive" | "neutral" | "negative", "detail": "..." },
    { "factor": "Foot Traffic", "signal": "...", "detail": "..." },
    { "factor": "Safety", "signal": "...", "detail": "..." },
    { "factor": "Infrastructure", "signal": "...", "detail": "..." },
    { "factor": "Budget Fit", "signal": "...", "detail": "..." }
  ],
  "nextSteps": [
    { "step": "Action item", "priority": "required" | "recommended" | "optional", "estimatedDays": number_or_null }
  ],
  "openQuestions": [],
  "overallGlowColor": "green" | "amber" | "red"
}

Rules:
- feasibilityScore MUST differ from the previous score based on the answers
- Include a "Budget Fit" factor that reflects whether their budget matches the area
- If alcohol is selected, add ABC license and/or CUP to nextSteps with realistic timelines
- If hours are evening/night, weight safety factor more heavily
- overallGlowColor: "green" if score >= 70, "amber" if 40-69, "red" if < 40
- Be specific with numbers, plain English, no jargon

Return ONLY valid JSON.`,
    'You refine business location assessments based on owner input. Return only valid JSON.');

  // Generate a conversational message about what changed
  const scoreDelta = synthesis.feasibilityScore - currentSynthesis.feasibilityScore;
  const direction = scoreDelta > 0 ? 'up' : scoreDelta < 0 ? 'down' : 'unchanged';
  const deltaStr = scoreDelta !== 0 ? ` (${scoreDelta > 0 ? '+' : ''}${scoreDelta} points)` : '';

  const message = await llm(ctx, 'refineMessage', {
    systemPrompt: 'Write 1-2 conversational sentences explaining how the user\'s answer changed their assessment. Be specific about what shifted. Keep it brief and helpful.',
    prompt: `Business: ${businessType} at ${address}
Answers given: ${answersText}
Score went ${direction}${deltaStr}: ${currentSynthesis.feasibilityScore} → ${synthesis.feasibilityScore}
Verdict: ${currentSynthesis.possibleVerdict} → ${synthesis.possibleVerdict}
Write a brief note about the impact.`
  });

  return { message, synthesis };
}

export async function parseIntent(message: string): Promise<{ businessType: string; address: string }> {
  const ctx = createTrace('parse', 'intent');
  const result = await llmJSON<{ businessType: string; address: string }>(ctx, 'parseIntent', `
Extract the business type and street address from this message.

Message: "${message}"

Return JSON: { "businessType": "the type of business", "address": "just the street address" }

Rules:
- businessType should be a simple description like "coffee shop", "bakery", "restaurant"
- address should be ONLY the street address (e.g. "4567 Park Blvd"). Do NOT include city, state, or zip code.
- If you can't extract either field, use empty string

Return ONLY valid JSON.`,
    'You extract business type and address from natural language. Return only valid JSON.');
  return result;
}
