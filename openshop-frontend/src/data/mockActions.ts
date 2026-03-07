import type { BoardAction } from '../types'

export const mockActions: BoardAction[] = [
  { type: 'set_phase', data: 'identity' },
  { type: 'move_avatar', targetPosition: { x: -300, y: -100 } },
  {
    type: 'spawn_widget', widgetId: 'zoning', widgetType: 'verdict',
    position: { x: -300, y: -100 },
    data: {
      location: { lat: 32.7477, lng: -117.1297, matchedAddress: '3025 University Ave, San Diego, CA 92104', score: 100 },
      zoneName: 'CN-1-2', communityPlan: 'North Park', zoneCategory: 'commercial',
      useCategory: 'eating_drinking_establishments', designation: 'P',
      designationMeaning: 'Permitted by right',
      naicsCodes: [7225, 7222, 3118], verdict: 'Your bakery is permitted by right in this commercial zone.'
    },
    narrative: 'Good news: this location in North Park is zoned CN-1-2 (Commercial-Neighborhood), which permits bakeries by right. No conditional use permit needed.',
    glowColor: 'green'
  },
  { type: 'set_phase', data: 'feasibility' },
  { type: 'move_avatar', targetPosition: { x: -100, y: -200 } },
  {
    type: 'spawn_widget', widgetId: 'competition', widgetType: 'list',
    position: { x: -100, y: -200 },
    data: {
      competitors: [
        { dbaName: 'Nomad Donuts', naicsCode: 7225, naicsDescription: 'Bakeries and Tortilla Manufacturing', distanceMiles: 0.12, address: '3102 University Ave 92104' },
        { dbaName: 'Bread & Cie', naicsCode: 7225, naicsDescription: 'Bakeries and Tortilla Manufacturing', distanceMiles: 0.34, address: '350 University Ave 92103' },
        { dbaName: 'Cafe Madeleine', naicsCode: 7222, naicsDescription: 'Limited-Service Restaurants', distanceMiles: 0.18, address: '3003 University Ave 92104' },
        { dbaName: 'Subterranean Coffee', naicsCode: 7225, naicsDescription: 'Coffee and Snack Shops', distanceMiles: 0.22, address: '3041 University Ave 92104' },
        { dbaName: 'Parakeet Cafe', naicsCode: 7225, naicsDescription: 'Coffee and Snack Shops', distanceMiles: 0.41, address: '3001 Beech St 92102' }
      ],
      count: 23, radiusMiles: 0.5, marketDensity: 29.3,
      survivalRate: 72.4, survivalSampleSize: 312
    },
    narrative: '23 similar businesses within half a mile of your location. The survival rate for this category in San Diego is 72.4%, meaning roughly 3 in 4 similar businesses stay open.',
    glowColor: 'amber'
  },
  { type: 'move_avatar', targetPosition: { x: 100, y: -200 } },
  {
    type: 'spawn_widget', widgetId: 'footTraffic', widgetType: 'metric',
    position: { x: 200, y: -200 },
    data: {
      nearbyMeters: [
        { pole: 'NP-2847', distanceMiles: 0.03, totalTransactions: 14231, totalRevenue: 28462, monthlyAvg: 1185.9 },
        { pole: 'NP-2849', distanceMiles: 0.07, totalTransactions: 11087, totalRevenue: 22174, monthlyAvg: 923.9 }
      ],
      totalTransactions: 25318, avgMonthlyTransactions: 1055,
      citywideAvgMonthly: 541, pctOfCitywideAvg: 195,
      nearbyTransitStops: 4
    },
    narrative: 'This block sees 195% of the citywide average foot traffic. The nearest meter processes over 1,100 transactions per month. 4 transit stops within walking distance bring pedestrian flow without requiring parking.',
    glowColor: 'green'
  },
  { type: 'move_avatar', targetPosition: { x: -200, y: 100 } },
  {
    type: 'spawn_widget', widgetId: 'safety', widgetType: 'chart',
    position: { x: -300, y: 150 },
    data: {
      crimeByCategory: [
        { category: 'Theft/Larceny', count: 187, propertyCount: 187, violentCount: 0 },
        { category: 'Vandalism', count: 89, propertyCount: 89, violentCount: 0 },
        { category: 'Assault', count: 67, propertyCount: 0, violentCount: 67 },
        { category: 'Burglary', count: 52, propertyCount: 52, violentCount: 0 },
        { category: 'Drug/Narcotic', count: 31, propertyCount: 0, violentCount: 0 }
      ],
      totalCrimes: 701, violentCrimeRate: 14.8
    },
    narrative: '701 incidents in the past year within 500m. Property crimes (theft, vandalism) dominate at 85%. The violent crime rate of 14.8% is slightly below the citywide average.',
    glowColor: 'amber'
  },
  {
    type: 'spawn_widget', widgetId: 'responsiveness', widgetType: 'metric',
    position: { x: -50, y: 150 },
    data: {
      avgCaseAgeDays: 42,
      top311Services: [
        { serviceName: 'Graffiti Removal', count: 127 },
        { serviceName: 'Pothole Repair', count: 84 },
        { serviceName: 'Illegal Dumping', count: 61 }
      ]
    },
    glowColor: 'amber'
  },
  {
    type: 'spawn_widget', widgetId: 'streets', widgetType: 'metric',
    position: { x: 200, y: 150 },
    data: {
      avgPCI: 74, pciScope: 'citywide', pciDescription: 'Good', plannedRepairs: 3
    },
    glowColor: 'green'
  },
  {
    type: 'add_connection',
    sourceId: 'zoning', targetId: 'competition',
    label: 'By-right zoning invites more competition'
  },
  {
    type: 'add_connection',
    sourceId: 'competition', targetId: 'footTraffic',
    label: 'Competitors cluster near busiest blocks'
  },
  {
    type: 'add_connection',
    sourceId: 'safety', targetId: 'footTraffic',
    label: 'High foot traffic correlates with more property crime'
  },
  {
    type: 'ask_question',
    widgetId: 'alcohol_question',
    question: 'Will you serve alcohol (beer, wine, or cocktails)?',
    inputType: 'toggle',
    position: { x: 350, y: 0 },
  },
  { type: 'set_phase', data: 'permits' },
  { type: 'move_avatar', targetPosition: { x: 0, y: 300 } },
  {
    type: 'spawn_widget', widgetId: 'permits', widgetType: 'timeline',
    position: { x: -50, y: 350 },
    data: {
      communityPlan: 'North Park', medianDays: 11, p25Days: 5, p75Days: 34,
      totalPermits: 247,
      similarProjects: [
        { projectId: 'PRJ-2024-8271', projectTitle: 'BAKERY TENANT IMPROVEMENT', approvalType: 'BUILDING PERMIT', daysToApproval: 8 },
        { projectId: 'PRJ-2024-6102', projectTitle: 'COFFEE SHOP INTERIOR REMODEL', approvalType: 'BUILDING PERMIT', daysToApproval: 14 },
        { projectId: 'PRJ-2023-9437', projectTitle: 'RESTAURANT COMMERCIAL KITCHEN', approvalType: 'BUILDING PERMIT', daysToApproval: 23 }
      ]
    },
    narrative: 'Permits in North Park have a median approval time of 11 days. The fastest 25% get approved in 5 days. A similar bakery tenant improvement was approved in just 8 days last year.',
    glowColor: 'green'
  },
  { type: 'set_phase', data: 'synthesis' },
  { type: 'move_avatar', targetPosition: { x: 0, y: 450 } },
  {
    type: 'spawn_widget', widgetId: 'synthesis', widgetType: 'narrative',
    position: { x: -50, y: 530 },
    narrative: `This location at 3025 University Ave in North Park is a strong candidate for a bakery. The zoning is favorable - CN-1-2 commercial zoning permits bakeries by right, so you can skip the conditional use permit process entirely.\n\nThe competitive landscape is moderately dense with 23 similar businesses within half a mile, but the 72.4% survival rate suggests the market sustains this kind of business well. Nomad Donuts at 0.12 miles is your closest direct competitor.\n\nFoot traffic is a standout metric here. This block sees nearly double the citywide average, with 4 transit stops bringing in pedestrian flow. That kind of walk-by traffic is exactly what a bakery needs.\n\nSafety is typical for an urban commercial corridor - property crime dominates, with theft and vandalism being the primary concerns. The violent crime rate is actually below average. City responsiveness to reported issues averages 42 days, which is slightly above ideal.\n\nThe permit timeline is encouraging. Similar projects in North Park have been approved in as little as 8 days. Budget 2-5 weeks for the full process from application to opening.\n\nOverall recommendation: this is a viable location with strong fundamentals. The high foot traffic and favorable zoning offset the competitive density. Focus your differentiation strategy on what sets you apart from Nomad Donuts and the nearby coffee shops.`,
    glowColor: 'green'
  }
]

export const mockGeocoded = { lat: 32.7477, lng: -117.1297 }
export const mockCommunityPlan = 'North Park'
export const mockZoneName = 'CN-1-2'
