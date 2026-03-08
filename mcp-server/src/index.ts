#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BACKEND_BASE = process.env.OPENSHOP_BACKEND_URL ?? 'http://localhost:3000';

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

interface BackendError {
  error: string;
}

async function callBackend<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const url = `${BACKEND_BASE}/api${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not connect to OpenShop backend at ${BACKEND_BASE}. ` +
      `Make sure the server is running (cd openshop && bun run start). ` +
      `Details: ${msg}`
    );
  }

  if (!res.ok) {
    let detail = '';
    try {
      const errBody = (await res.json()) as BackendError;
      detail = errBody.error ?? JSON.stringify(errBody);
    } catch {
      detail = await res.text();
    }
    throw new Error(`Backend returned ${res.status}: ${detail}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Response types (mirrors backend types, kept lightweight)
// ---------------------------------------------------------------------------

interface ToolResult<T> {
  data: T;
  narrative: string;
  glowColor: string;
}

interface ZoningData {
  location: { lat: number; lng: number; matchedAddress: string; score: number };
  zoneName: string;
  communityPlan: string;
  zoneCategory: string;
  useCategory: string;
  designation: string;
  designationMeaning: string;
  verdict: string;
}

interface Competitor {
  dbaName: string;
  naicsDescription: string;
  distanceMiles: number;
  address: string;
}

interface CompetitionData {
  competitors: Competitor[];
  count: number;
  radiusMiles: number;
  marketDensity: number;
  survivalRate: number | null;
  survivalSampleSize: number;
}

interface MeterActivity {
  pole: string;
  distanceMiles: number;
  totalTransactions: number;
  monthlyAvg: number;
}

interface FootTrafficData {
  nearbyMeters: MeterActivity[];
  totalTransactions: number;
  avgMonthlyTransactions: number;
  citywideAvgMonthly: number;
  pctOfCitywideAvg: number;
  nearbyTransitStops: number;
}

interface PermitExample {
  projectId: string;
  projectTitle: string;
  approvalType: string;
  daysToApproval: number;
}

interface PermitData {
  communityPlan: string;
  medianDays: number;
  p25Days: number;
  p75Days: number;
  totalPermits: number;
  similarProjects: PermitExample[];
}

interface CrimeSummary {
  category: string;
  count: number;
  propertyCount: number;
  violentCount: number;
}

interface ServiceRequest311 {
  serviceName: string;
  count: number;
}

interface NeighborhoodData {
  crimeByCategory: CrimeSummary[];
  totalCrimes: number;
  violentCrimeRate: number;
  avgCaseAgeDays: number | null;
  top311Services: ServiceRequest311[];
  streetQuality: {
    avgPCI: number | null;
    pciScope: string;
    pciDescription: string;
    plannedRepairs: number;
  };
}

interface FeasibilityFactor {
  factor: string;
  signal: string;
  detail: string;
}

interface NextStep {
  step: string;
  priority: string;
  estimatedDays?: number;
}

interface StructuredSynthesis {
  possibleVerdict: string;
  possibleSummary: string;
  feasibilityScore: number;
  feasibilityFactors: FeasibilityFactor[];
  nextSteps: NextStep[];
  openQuestions: string[];
  overallGlowColor: string;
}

interface FollowUpQuestion {
  id: string;
  question: string;
  inputType: string;
  options?: string[];
}

interface DashboardResponse {
  geocoded: { lat: number; lng: number };
  communityPlan: string;
  zoneName: string;
  zoning: ToolResult<ZoningData>;
  competition: ToolResult<CompetitionData> | null;
  footTraffic: ToolResult<FootTrafficData> | null;
  neighborhood: ToolResult<NeighborhoodData> | null;
  permits: ToolResult<PermitData>;
  synthesis: StructuredSynthesis;
  questions: FollowUpQuestion[];
  traceId: string;
}

// ---------------------------------------------------------------------------
// Formatters — turn JSON into readable text
// ---------------------------------------------------------------------------

function glowEmoji(color: string): string {
  switch (color) {
    case 'green': return '[POSITIVE]';
    case 'amber': return '[CAUTION]';
    case 'red': return '[NEGATIVE]';
    default: return '[NEUTRAL]';
  }
}

function formatZoning(r: ToolResult<ZoningData>): string {
  const d = r.data;
  return [
    `ZONING CHECK ${glowEmoji(r.glowColor)}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Address: ${d.location.matchedAddress}`,
    `Zone: ${d.zoneName}`,
    `Category: ${d.zoneCategory}`,
    `Use category: ${d.useCategory}`,
    `Designation: ${d.designation} — ${d.designationMeaning}`,
    `Community plan: ${d.communityPlan}`,
    `Verdict: ${d.verdict}`,
    ``,
    `Narrative: ${r.narrative}`,
  ].join('\n');
}

function formatCompetition(r: ToolResult<CompetitionData>): string {
  const d = r.data;
  const lines = [
    `COMPETITION ANALYSIS ${glowEmoji(r.glowColor)}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Competitors within ${d.radiusMiles} mi: ${d.count}`,
    `Market density: ${d.marketDensity.toFixed(1)} per sq mi`,
  ];
  if (d.survivalRate !== null) {
    lines.push(`Survival rate: ${(d.survivalRate * 100).toFixed(0)}% (sample: ${d.survivalSampleSize})`);
  }
  if (d.competitors.length > 0) {
    lines.push('', 'Nearby competitors:');
    for (const c of d.competitors.slice(0, 10)) {
      lines.push(`  - ${c.dbaName} (${c.naicsDescription}) — ${c.distanceMiles.toFixed(2)} mi, ${c.address}`);
    }
    if (d.competitors.length > 10) {
      lines.push(`  ... and ${d.competitors.length - 10} more`);
    }
  }
  lines.push('', `Narrative: ${r.narrative}`);
  return lines.join('\n');
}

function formatTraffic(r: ToolResult<FootTrafficData>): string {
  const d = r.data;
  const lines = [
    `FOOT TRAFFIC ANALYSIS ${glowEmoji(r.glowColor)}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Nearby parking meters: ${d.nearbyMeters.length}`,
    `Total transactions: ${d.totalTransactions.toLocaleString()}`,
    `Avg monthly transactions: ${d.avgMonthlyTransactions.toLocaleString()}`,
    `Citywide avg monthly: ${d.citywideAvgMonthly.toLocaleString()}`,
    `% of citywide avg: ${d.pctOfCitywideAvg.toFixed(0)}%`,
    `Nearby transit stops: ${d.nearbyTransitStops}`,
  ];
  if (d.nearbyMeters.length > 0) {
    lines.push('', 'Top meters:');
    for (const m of d.nearbyMeters.slice(0, 5)) {
      lines.push(`  - Pole ${m.pole}: ${m.totalTransactions.toLocaleString()} txns, ${m.monthlyAvg.toFixed(0)}/mo, ${m.distanceMiles.toFixed(2)} mi`);
    }
  }
  lines.push('', `Narrative: ${r.narrative}`);
  return lines.join('\n');
}

function formatPermits(r: ToolResult<PermitData>): string {
  const d = r.data;
  const lines = [
    `PERMIT TIMELINE ${glowEmoji(r.glowColor)}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Community plan: ${d.communityPlan}`,
    `Total permits analyzed: ${d.totalPermits}`,
    `Median days to approval: ${d.medianDays}`,
    `25th percentile: ${d.p25Days} days`,
    `75th percentile: ${d.p75Days} days`,
  ];
  if (d.similarProjects.length > 0) {
    lines.push('', 'Similar projects:');
    for (const p of d.similarProjects.slice(0, 5)) {
      lines.push(`  - ${p.projectTitle} (${p.approvalType}) — ${p.daysToApproval} days`);
    }
  }
  lines.push('', `Narrative: ${r.narrative}`);
  return lines.join('\n');
}

function formatNeighborhood(r: ToolResult<NeighborhoodData>): string {
  const d = r.data;
  const lines = [
    `NEIGHBORHOOD PROFILE ${glowEmoji(r.glowColor)}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Safety:`,
    `  Total crimes (nearby): ${d.totalCrimes}`,
    `  Violent crime rate: ${(d.violentCrimeRate * 100).toFixed(1)}%`,
  ];
  if (d.avgCaseAgeDays !== null) {
    lines.push(`  Avg case age: ${d.avgCaseAgeDays.toFixed(0)} days`);
  }
  if (d.crimeByCategory.length > 0) {
    lines.push('', '  Crime breakdown:');
    for (const c of d.crimeByCategory) {
      lines.push(`    - ${c.category}: ${c.count} (${c.violentCount} violent, ${c.propertyCount} property)`);
    }
  }
  lines.push('', `Streets:`);
  const sq = d.streetQuality;
  if (sq.avgPCI !== null) {
    lines.push(`  Pavement Condition Index: ${sq.avgPCI.toFixed(0)} (${sq.pciDescription})`);
  } else {
    lines.push(`  Pavement Condition Index: N/A (${sq.pciDescription})`);
  }
  lines.push(`  Scope: ${sq.pciScope}`);
  lines.push(`  Planned repairs: ${sq.plannedRepairs}`);

  if (d.top311Services.length > 0) {
    lines.push('', '311 Service requests:');
    for (const s of d.top311Services) {
      lines.push(`  - ${s.serviceName}: ${s.count}`);
    }
  }
  lines.push('', `Narrative: ${r.narrative}`);
  return lines.join('\n');
}

function formatSynthesis(s: StructuredSynthesis): string {
  const lines = [
    `OVERALL ASSESSMENT ${glowEmoji(s.overallGlowColor)}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Verdict: ${s.possibleVerdict.toUpperCase()}`,
    `Feasibility score: ${s.feasibilityScore}/100`,
    `Summary: ${s.possibleSummary}`,
  ];
  if (s.feasibilityFactors.length > 0) {
    lines.push('', 'Feasibility factors:');
    for (const f of s.feasibilityFactors) {
      const signal = f.signal === 'positive' ? '+' : f.signal === 'negative' ? '-' : '~';
      lines.push(`  [${signal}] ${f.factor}: ${f.detail}`);
    }
  }
  if (s.nextSteps.length > 0) {
    lines.push('', 'Next steps:');
    for (const n of s.nextSteps) {
      const days = n.estimatedDays ? ` (~${n.estimatedDays} days)` : '';
      lines.push(`  [${n.priority}] ${n.step}${days}`);
    }
  }
  if (s.openQuestions.length > 0) {
    lines.push('', 'Open questions:');
    for (const q of s.openQuestions) {
      lines.push(`  - ${q}`);
    }
  }
  return lines.join('\n');
}

function formatFullAssessment(r: DashboardResponse): string {
  const sections: string[] = [
    `OPENSHOP FULL LOCATION ASSESSMENT`,
    `==================================`,
    `Location: ${r.geocoded.lat.toFixed(5)}, ${r.geocoded.lng.toFixed(5)}`,
    `Community plan: ${r.communityPlan}`,
    `Zone: ${r.zoneName}`,
    `Trace ID: ${r.traceId}`,
    '',
  ];

  sections.push(formatZoning(r.zoning), '');

  if (r.competition) {
    sections.push(formatCompetition(r.competition), '');
  }
  if (r.footTraffic) {
    sections.push(formatTraffic(r.footTraffic), '');
  }
  if (r.permits) {
    sections.push(formatPermits(r.permits), '');
  }
  if (r.neighborhood) {
    sections.push(formatNeighborhood(r.neighborhood), '');
  }

  sections.push(formatSynthesis(r.synthesis));

  if (r.questions.length > 0) {
    sections.push('', 'FOLLOW-UP QUESTIONS:');
    for (const q of r.questions) {
      const opts = q.options ? ` (options: ${q.options.join(', ')})` : '';
      sections.push(`  - ${q.question}${opts}`);
    }
  }

  return sections.join('\n');
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer(
  {
    name: 'openshop',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
    instructions:
      'OpenShop is a San Diego business location intelligence tool. ' +
      'Use these tools to assess whether a specific address is suitable for a given business type. ' +
      'The OpenShop backend must be running on localhost:3000 (or set OPENSHOP_BACKEND_URL).',
  }
);

// --- Tool: Full assessment ---
server.registerTool(
  'openshop_assess_location',
  {
    title: 'OpenShop Full Location Assessment',
    description:
      'Run a complete business location assessment for a San Diego address. ' +
      'Checks zoning, competition, foot traffic, permits, and neighborhood safety, ' +
      'then synthesizes an overall feasibility verdict. Takes 15-30 seconds.',
    inputSchema: {
      businessType: z.string().describe('Type of business (e.g. "coffee shop", "yoga studio", "restaurant")'),
      address: z.string().describe('San Diego street address (e.g. "1234 University Ave, San Diego, CA")'),
    },
  },
  async ({ businessType, address }) => {
    const result = await callBackend<DashboardResponse>('/orchestrate', { businessType, address });
    return {
      content: [{ type: 'text', text: formatFullAssessment(result) }],
    };
  }
);

// --- Tool: Zoning check ---
server.registerTool(
  'openshop_check_zoning',
  {
    title: 'OpenShop Zoning Check',
    description:
      'Check if a business type is allowed at a San Diego address based on zoning regulations. ' +
      'Returns zone name, category, use designation, and a permit verdict.',
    inputSchema: {
      address: z.string().describe('San Diego street address'),
      businessType: z.string().describe('Type of business to check zoning for'),
    },
  },
  async ({ address, businessType }) => {
    const result = await callBackend<ToolResult<ZoningData>>('/zoning', { address, businessType });
    return {
      content: [{ type: 'text', text: formatZoning(result) }],
    };
  }
);

// --- Tool: Competition analysis ---
server.registerTool(
  'openshop_competition',
  {
    title: 'OpenShop Competition Analysis',
    description:
      'Analyze nearby competitors for a given business type around a San Diego address. ' +
      'Returns competitor count, market density, survival rate, and individual competitor details.',
    inputSchema: {
      address: z.string().describe('San Diego street address'),
      businessType: z.string().describe('Type of business to find competitors for'),
    },
  },
  async ({ address, businessType }) => {
    const result = await callBackend<ToolResult<CompetitionData>>('/competition', { address, businessType });
    return {
      content: [{ type: 'text', text: formatCompetition(result) }],
    };
  }
);

// --- Tool: Foot traffic ---
server.registerTool(
  'openshop_foot_traffic',
  {
    title: 'OpenShop Foot Traffic Analysis',
    description:
      'Analyze foot traffic around a San Diego address using parking meter data and transit stops. ' +
      'Returns transaction volumes, monthly averages, and comparison to citywide averages.',
    inputSchema: {
      address: z.string().describe('San Diego street address'),
    },
  },
  async ({ address }) => {
    const result = await callBackend<ToolResult<FootTrafficData>>('/traffic', { address });
    return {
      content: [{ type: 'text', text: formatTraffic(result) }],
    };
  }
);

// --- Tool: Permits ---
server.registerTool(
  'openshop_permits',
  {
    title: 'OpenShop Permit Timeline',
    description:
      'Get permit approval timeline estimates for a business type at a San Diego address. ' +
      'Returns median approval days, percentile ranges, and similar past projects.',
    inputSchema: {
      address: z.string().describe('San Diego street address'),
      businessType: z.string().describe('Type of business to check permits for'),
    },
  },
  async ({ address, businessType }) => {
    const result = await callBackend<ToolResult<PermitData>>('/permits', { address, businessType });
    return {
      content: [{ type: 'text', text: formatPermits(result) }],
    };
  }
);

// --- Tool: Neighborhood profile ---
server.registerTool(
  'openshop_neighborhood',
  {
    title: 'OpenShop Neighborhood Profile',
    description:
      'Get a neighborhood safety and quality profile for a San Diego address. ' +
      'Returns crime statistics, street pavement quality, and 311 service request data.',
    inputSchema: {
      address: z.string().describe('San Diego street address'),
    },
  },
  async ({ address }) => {
    const result = await callBackend<ToolResult<NeighborhoodData>>('/neighborhood', { address });
    return {
      content: [{ type: 'text', text: formatNeighborhood(result) }],
    };
  }
);

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OpenShop MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error starting OpenShop MCP server:', err);
  process.exit(1);
});
