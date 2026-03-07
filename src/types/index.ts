export interface ToolResult<T> {
  data: T;
  narrative: string;
  glowColor: 'green' | 'amber' | 'red' | 'neutral';
  insightLinks?: { targetWidgetId: string; insight: string }[];
}

export interface GeocodedLocation {
  lat: number;
  lng: number;
  matchedAddress: string;
  score: number;
}

export interface ZoningData {
  location: GeocodedLocation;
  zoneName: string;
  communityPlan: string;
  zoneCategory: 'commercial' | 'residential' | 'industrial' | 'mixed' | 'unknown';
  useCategory: string;
  designation: string;
  designationMeaning: string;
  naicsCodes: number[];
  verdict: string;
}

export interface BoardAction {
  type: 'spawn_widget' | 'update_widget' | 'add_connection' |
        'move_avatar' | 'ask_question' | 'set_phase';
  widgetId?: string;
  widgetType?: 'verdict' | 'metric' | 'list' | 'chart' | 'timeline' | 'narrative' | 'input';
  position?: { x: number; y: number };
  data?: any;
  narrative?: string;
  glowColor?: 'green' | 'amber' | 'red' | 'neutral';
  sourceId?: string;
  targetId?: string;
  label?: string;
  question?: string;
  inputType?: 'text' | 'select' | 'toggle' | 'slider' | 'time_range';
  options?: string[];
  targetPosition?: { x: number; y: number };
}

export interface Competitor {
  dbaName: string;
  naicsCode: number;
  naicsDescription: string;
  distanceMiles: number;
  address: string;
}

export interface CompetitionData {
  competitors: Competitor[];
  count: number;
  radiusMiles: number;
  marketDensity: number;
  survivalRate: number | null;
  survivalSampleSize: number;
}

export interface MeterActivity {
  pole: string;
  distanceMiles: number;
  totalTransactions: number;
  totalRevenue: number;
  monthlyAvg: number;
}

export interface FootTrafficData {
  nearbyMeters: MeterActivity[];
  totalTransactions: number;
  avgMonthlyTransactions: number;
  citywideAvgMonthly: number;
  pctOfCitywideAvg: number;
  nearbyTransitStops: number;
}

export interface PermitExample {
  projectId: string;
  projectTitle: string;
  approvalType: string;
  daysToApproval: number;
}

export interface PermitData {
  communityPlan: string;
  medianDays: number;
  p25Days: number;
  p75Days: number;
  totalPermits: number;
  similarProjects: PermitExample[];
}

export interface CrimeSummary {
  category: string;
  count: number;
  propertyCount: number;
  violentCount: number;
}

export interface ServiceRequest311 {
  serviceName: string;
  count: number;
}

export interface StreetQuality {
  avgPCI: number | null;
  pciScope: 'citywide' | 'local';
  pciDescription: string;
  plannedRepairs: number;
}

export interface NeighborhoodData {
  crimeByCategory: CrimeSummary[];
  totalCrimes: number;
  violentCrimeRate: number;
  avgCaseAgeDays: number | null;
  top311Services: ServiceRequest311[];
  streetQuality: StreetQuality;
}

export interface AssessmentData {
  location: GeocodedLocation;
  communityPlan: string;
  zoning: ToolResult<ZoningData> | null;
  competition: ToolResult<CompetitionData> | null;
  footTraffic: ToolResult<FootTrafficData> | null;
  permits: ToolResult<PermitData> | null;
  neighborhood: ToolResult<NeighborhoodData> | null;
}
