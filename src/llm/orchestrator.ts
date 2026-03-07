import { createTrace } from '../telemetry/trace.js';
import type { TraceContext } from '../telemetry/trace.js';
import type { BoardAction, ToolResult, ZoningData, CompetitionData, FootTrafficData, PermitData, NeighborhoodData } from '../types/index.js';
import { geocode, getCommunityPlan } from '../data/arcgis.js';
import { mapBusinessType } from './business-mapper.js';
import { llmJSON, llm } from './client.js';
import { checkZoning } from '../tools/checkZoning.js';
import { competitiveLandscape } from '../tools/competitiveLandscape.js';
import { footTraffic } from '../tools/footTraffic.js';
import { permitRoadmap } from '../tools/permitRoadmap.js';
import { neighborhoodProfile } from '../tools/neighborhoodProfile.js';

interface OrchestrateResult {
  actions: BoardAction[];
  geocoded: { lat: number; lng: number };
  communityPlan: string;
  zoneName: string;
  traceId: string;
}

export async function orchestrate(businessType: string, address: string): Promise<OrchestrateResult> {
  const ctx = createTrace(address, businessType);
  const actions: BoardAction[] = [];

  // Phase 1: Geocode + business mapping (parallel)
  const [geo, mapping] = await Promise.all([
    geocode(ctx, address),
    mapBusinessType(ctx, businessType)
  ]);

  const community = await getCommunityPlan(ctx, geo.lat, geo.lng);
  const communityName = community.cpName;

  // Phase 2: Zoning (depends on geocode + mapping)
  actions.push({ type: 'set_phase', data: 'identity' });
  actions.push({ type: 'move_avatar', targetPosition: { x: -300, y: -100 } });

  const zoningResult = await checkZoning(ctx, address, businessType, geo.lat, geo.lng, communityName, mapping);

  actions.push({
    type: 'spawn_widget', widgetId: 'zoning', widgetType: 'verdict',
    position: { x: -300, y: -100 }, data: zoningResult.data,
    narrative: zoningResult.narrative, glowColor: zoningResult.glowColor
  });

  // Phase 3: Feasibility (parallel — competition, traffic, neighborhood)
  actions.push({ type: 'set_phase', data: 'feasibility' });

  const results = await Promise.allSettled([
    competitiveLandscape(ctx, geo.lat, geo.lng, mapping.naicsCodes, 0.5, businessType, address),
    footTraffic(ctx, geo.lat, geo.lng, 0.3, businessType, address),
    neighborhoodProfile(ctx, geo.lat, geo.lng, communityName, businessType, address)
  ]);

  const competition = results[0].status === 'fulfilled' ? results[0].value : null;
  const traffic = results[1].status === 'fulfilled' ? results[1].value : null;
  const hood = results[2].status === 'fulfilled' ? results[2].value : null;

  if (competition) {
    actions.push({
      type: 'spawn_widget', widgetId: 'competition', widgetType: 'list',
      position: { x: -100, y: -200 }, data: competition.data,
      narrative: competition.narrative, glowColor: competition.glowColor
    });
  }

  if (traffic) {
    actions.push({
      type: 'spawn_widget', widgetId: 'footTraffic', widgetType: 'metric',
      position: { x: 100, y: -200 }, data: traffic.data,
      narrative: traffic.narrative, glowColor: traffic.glowColor
    });
  }

  if (hood) {
    actions.push({
      type: 'spawn_widget', widgetId: 'safety', widgetType: 'chart',
      position: { x: -200, y: 100 }, data: { crimeByCategory: hood.data.crimeByCategory, totalCrimes: hood.data.totalCrimes, violentCrimeRate: hood.data.violentCrimeRate },
      narrative: hood.narrative, glowColor: hood.glowColor
    });
    actions.push({
      type: 'spawn_widget', widgetId: 'responsiveness', widgetType: 'metric',
      position: { x: 0, y: 100 }, data: { avgCaseAgeDays: hood.data.avgCaseAgeDays, top311Services: hood.data.top311Services },
      glowColor: hood.data.avgCaseAgeDays !== null && hood.data.avgCaseAgeDays <= 30 ? 'green' : 'amber'
    });
    actions.push({
      type: 'spawn_widget', widgetId: 'streets', widgetType: 'metric',
      position: { x: 200, y: 100 }, data: hood.data.streetQuality,
      glowColor: hood.data.streetQuality.avgPCI !== null && hood.data.streetQuality.avgPCI >= 70 ? 'green' : 'amber'
    });
  }

  // Phase 4: Connection insights + follow-up questions (parallel LLM calls)
  const [connections, followUps] = await Promise.all([
    generateConnectionInsights(ctx, { zoning: zoningResult, competition, traffic, hood }),
    selectFollowUpQuestions(ctx, businessType, zoningResult, competition, traffic)
  ]);

  for (const conn of connections) {
    actions.push({
      type: 'add_connection',
      sourceId: conn.source,
      targetId: conn.target,
      label: conn.insight
    });
  }

  for (const q of followUps) {
    actions.push({
      type: 'ask_question',
      widgetId: q.id,
      question: q.question,
      inputType: q.inputType as any,
      options: q.options ?? undefined
    });
  }

  // Phase 5: Permit roadmap
  actions.push({ type: 'set_phase', data: 'permits' });

  const permits = await permitRoadmap(ctx, geo.lat, geo.lng, communityName, [businessType], businessType, address);

  actions.push({
    type: 'spawn_widget', widgetId: 'permits', widgetType: 'timeline',
    position: { x: 0, y: 300 }, data: permits.data,
    narrative: permits.narrative, glowColor: permits.glowColor
  });

  // Phase 6: Synthesis narrative
  actions.push({ type: 'set_phase', data: 'synthesis' });

  const synthesis = await generateSynthesis(ctx, businessType, address, {
    zoning: zoningResult, competition, traffic, hood, permits
  });

  actions.push({
    type: 'spawn_widget', widgetId: 'synthesis', widgetType: 'narrative',
    position: { x: 0, y: 450 },
    narrative: synthesis,
    glowColor: zoningResult.glowColor
  });

  const totalDuration = Date.now() - ctx.startTime;
  console.log(`\nOrchestration complete: ${actions.length} actions in ${totalDuration}ms\n`);

  return {
    actions,
    geocoded: { lat: geo.lat, lng: geo.lng },
    communityPlan: communityName,
    zoneName: zoningResult.data.zoneName,
    traceId: ctx.traceId
  };
}

interface ConnectionInsight {
  source: string;
  target: string;
  insight: string;
}

async function generateConnectionInsights(
  ctx: TraceContext,
  allResults: {
    zoning: ToolResult<ZoningData>;
    competition: ToolResult<CompetitionData> | null;
    traffic: ToolResult<FootTrafficData> | null;
    hood: ToolResult<NeighborhoodData> | null;
  }
): Promise<ConnectionInsight[]> {
  try {
    const result = await llmJSON<{ connections: ConnectionInsight[] }>(ctx, 'connectionInsights', `
Given this business location data, identify 2-4 meaningful connections between different data dimensions.

Zoning: ${JSON.stringify(allResults.zoning.data)}
Competition: ${allResults.competition ? JSON.stringify(allResults.competition.data) : 'N/A'}
Foot traffic: ${allResults.traffic ? JSON.stringify(allResults.traffic.data) : 'N/A'}
Neighborhood: ${allResults.hood ? JSON.stringify(allResults.hood.data) : 'N/A'}

Return JSON: { "connections": [
  { "source": "widgetId", "target": "widgetId", "insight": "max 10 words" }
]}

Valid widget IDs: zoning, competition, footTraffic, safety, streets, responsiveness
Return ONLY valid JSON.`,
      'You identify data relationships. Return only valid JSON.');
    return result.connections ?? [];
  } catch {
    return [];
  }
}

interface FollowUpQuestion {
  id: string;
  question: string;
  inputType: string;
  options: string[] | null;
  affectsWidgets: string[];
}

async function selectFollowUpQuestions(
  ctx: TraceContext,
  businessType: string,
  zoning: ToolResult<ZoningData>,
  competition: ToolResult<CompetitionData> | null,
  traffic: ToolResult<FootTrafficData> | null
): Promise<FollowUpQuestion[]> {
  try {
    const result = await llmJSON<{ questions: FollowUpQuestion[] }>(ctx, 'followUpQuestions', `
Given this business analysis, what 0-2 follow-up questions would meaningfully change the recommendation?

Business: ${businessType}
Zoning verdict: ${zoning.data.verdict}
Use category: ${zoning.data.useCategory}
Competitors found: ${competition?.data.count ?? 'N/A'}
Foot traffic vs citywide: ${traffic?.data.pctOfCitywideAvg ?? 'N/A'}%

Rules:
- Only ask if the answer changes a specific widget
- Keep questions dead simple (toggle, choice, or one number)
- Never ask about city bureaucracy (NAICS, zones, APNs)
- Return empty array if no questions needed

Return JSON: { "questions": [{ "id": "string", "question": "string",
"inputType": "toggle|select|slider", "options": ["a","b"] or null,
"affectsWidgets": ["widgetId"] }] }
Return ONLY valid JSON.`,
      'You select relevant follow-up questions. Return only valid JSON.');
    return result.questions ?? [];
  } catch {
    return [];
  }
}

async function generateSynthesis(
  ctx: TraceContext,
  businessType: string,
  address: string,
  allResults: {
    zoning: ToolResult<ZoningData>;
    competition: ToolResult<CompetitionData> | null;
    traffic: ToolResult<FootTrafficData> | null;
    hood: ToolResult<NeighborhoodData> | null;
    permits: ToolResult<PermitData>;
  }
): Promise<string> {
  try {
    return await llm(ctx, 'synthesis', {
      systemPrompt: `You write comprehensive business location assessments. Write 4-6 paragraphs in plain conversational English. Be specific with numbers and names. Structure as: overall verdict, zoning situation, competitive landscape, location quality, and practical next steps.`,
      prompt: `Write a full assessment for opening a ${businessType} at ${address}.

Zoning: ${JSON.stringify(allResults.zoning.data)}
Competition: ${allResults.competition ? JSON.stringify(allResults.competition.data) : 'No data'}
Foot Traffic: ${allResults.traffic ? JSON.stringify(allResults.traffic.data) : 'No data'}
Neighborhood: ${allResults.hood ? JSON.stringify(allResults.hood.data) : 'No data'}
Permits: ${JSON.stringify(allResults.permits.data)}

Write 4-6 paragraphs.`,
      maxTokens: 10000
    });
  } catch (err: any) {
    console.error('Synthesis generation failed:', err.message);
    return '';
  }
}
