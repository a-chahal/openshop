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

  // Phase 4: Structured synthesis + follow-up questions (parallel)
  const [synthesis, followUps] = await Promise.all([
    generateStructuredSynthesis(ctx, businessType, address, {
      zoning: zoningResult, competition, traffic, hood, permits
    }),
    selectFollowUpQuestions(ctx, businessType, zoningResult, competition, traffic, address)
  ]);

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

export async function selectFollowUpQuestions(
  ctx: TraceContext,
  businessType: string,
  zoning: ToolResult<ZoningData>,
  competition: ToolResult<CompetitionData> | null,
  traffic: ToolResult<FootTrafficData> | null,
  address?: string
): Promise<FollowUpQuestion[]> {
  try {
    const result = await llmJSON<{ questions: FollowUpQuestion[] }>(ctx, 'followUpQuestions', `
Given this business analysis, generate 3-5 follow-up questions that help refine and personalize the recommendation for this specific business.

Business: ${businessType}
Address: ${address}
Zoning verdict: ${zoning.data.verdict}
Use category: ${zoning.data.useCategory}
Competitors found: ${competition?.data.count ?? 'N/A'}
Foot traffic vs citywide: ${traffic?.data.pctOfCitywideAvg ?? 'N/A'}%
Survival rate: ${competition?.data.survivalRate ?? 'N/A'}%

Rules:
- Ask about the BUSINESS, not the location data (budget, experience, timeline, concept, target market)
- Each question should unlock a concrete recommendation when answered
- Mix question types: some with preset options, some open-ended
- Ask about things that differentiate this business from competitors
- Never ask about city bureaucracy (NAICS, zones, APNs)
- Good examples: budget range, opening timeline, prior experience, dine-in vs takeout, target demographic, hours of operation, whether they need a liquor license
- Questions should feel like a conversation with a knowledgeable advisor

Return JSON: { "questions": [{ "id": "string", "question": "string",
"inputType": "select|text|toggle", "options": ["a","b","c"] or null }] }
Return ONLY valid JSON.`,
      'You select relevant follow-up questions. Return only valid JSON.');
    return result.questions ?? [];
  } catch {
    return [];
  }
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
