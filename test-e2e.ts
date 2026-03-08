// E2E test suite for OpenShop API (Dashboard format)
// Start the server first: npx tsx src/server.ts

const BASE = 'http://localhost:3000/api';

let passed = 0;
let failed = 0;

function pass(msg: string) { passed++; console.log(`  PASS  ${msg}`); }
function fail(msg: string, detail?: string) { failed++; console.log(`  FAIL  ${msg}${detail ? ` — ${detail}` : ''}`); }

async function post(path: string, body: any): Promise<{ status: number; data: any; ms: number }> {
  const start = Date.now();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000)
  });
  const data = await res.json();
  return { status: res.status, data, ms: Date.now() - start };
}

const ADDRESSES = [
  { name: 'North Park', address: '3025 University Ave, San Diego, CA', businessType: 'bakery with coffee' },
  { name: 'Pacific Beach', address: '1001 Garnet Ave, San Diego, CA', businessType: 'restaurant' },
  { name: 'City Heights', address: '4350 El Cajon Blvd, San Diego, CA', businessType: 'grocery store' },
  { name: 'Downtown', address: '750 B St, San Diego, CA', businessType: 'coffee shop' },
  { name: 'Clairemont', address: '4567 Clairemont Dr, San Diego, CA', businessType: 'restaurant' },
];

async function main() {
  console.log('\n========================================');
  console.log('  OpenShop E2E Tests');
  console.log('========================================\n');

  // 1. Health check
  console.log('--- Health ---');
  try {
    const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    res.status === 200 ? pass('GET /health 200') : fail('GET /health', `${res.status}`);
    data.status === 'ok' ? pass('status: ok') : fail('status', data.status);
    data.timestamp ? pass('has timestamp') : fail('missing timestamp');
  } catch (err: any) {
    fail('Health check failed — is the server running?', err.message);
    console.log('\n  Start the server first: npx tsx src/server.ts\n');
    process.exit(1);
  }

  // 2. Parse intent
  console.log('\n--- Parse Intent ---');
  const intent = await post('/parse-intent', { message: 'I want to open a bakery at 4567 Park Blvd' });
  intent.status === 200 ? pass('parse-intent 200') : fail('parse-intent', `HTTP ${intent.status}`);
  intent.data?.businessType ? pass(`businessType: ${intent.data.businessType}`) : fail('missing businessType');
  intent.data?.address ? pass(`address: ${intent.data.address}`) : fail('missing address');

  // 3. Individual tool endpoints per address
  for (const addr of ADDRESSES) {
    console.log(`\n--- ${addr.name} (${addr.address}) ---`);

    const [zoning, competition, traffic, permits, neighborhood] = await Promise.all([
      post('/zoning', { address: addr.address, businessType: addr.businessType }),
      post('/competition', { address: addr.address, businessType: addr.businessType }),
      post('/traffic', { address: addr.address }),
      post('/permits', { address: addr.address, businessType: addr.businessType }),
      post('/neighborhood', { address: addr.address }),
    ]);

    // Zoning
    zoning.status === 200
      ? pass(`zoning 200 (${zoning.ms}ms)`)
      : fail('zoning', `HTTP ${zoning.status}: ${JSON.stringify(zoning.data).slice(0, 200)}`);
    if (zoning.data?.data?.zoneName) {
      pass(`zone: ${zoning.data.data.zoneName} [${zoning.data.glowColor}]`);
    } else {
      fail('zoning: missing zoneName');
    }
    if (addr.name === 'Clairemont') {
      zoning.data.glowColor === 'red'
        ? pass('residential: red glow')
        : fail('residential: expected red glow', `got ${zoning.data.glowColor}`);
    }

    // Competition
    competition.status === 200
      ? pass(`competition 200 (${competition.ms}ms)`)
      : fail('competition', `HTTP ${competition.status}`);
    if (competition.data?.data?.count !== undefined) {
      pass(`competitors: ${competition.data.data.count}, survival: ${competition.data.data.survivalRate}%`);
    } else {
      fail('competition: missing count');
    }

    // Traffic
    traffic.status === 200
      ? pass(`traffic 200 (${traffic.ms}ms)`)
      : fail('traffic', `HTTP ${traffic.status}`);
    if (traffic.data?.data?.pctOfCitywideAvg !== undefined) {
      pass(`traffic: ${traffic.data.data.pctOfCitywideAvg}% of citywide [${traffic.data.glowColor}]`);
    } else {
      fail('traffic: missing pctOfCitywideAvg');
    }

    // Permits
    permits.status === 200
      ? pass(`permits 200 (${permits.ms}ms)`)
      : fail('permits', `HTTP ${permits.status}`);
    if (permits.data?.data?.medianDays !== undefined && permits.data.data.medianDays >= 0) {
      pass(`permits: median ${permits.data.data.medianDays}d, total ${permits.data.data.totalPermits}`);
    } else {
      fail('permits: invalid medianDays');
    }

    // Neighborhood
    neighborhood.status === 200
      ? pass(`neighborhood 200 (${neighborhood.ms}ms)`)
      : fail('neighborhood', `HTTP ${neighborhood.status}`);
    if (neighborhood.data?.data?.totalCrimes !== undefined) {
      pass(`crimes: ${neighborhood.data.data.totalCrimes}, violent rate: ${neighborhood.data.data.violentCrimeRate}%`);
    } else {
      fail('neighborhood: missing totalCrimes');
    }
  }

  // 4. Orchestrate tests (DashboardResponse format)
  console.log('\n--- Orchestrate ---');
  for (const addr of ADDRESSES) {
    console.log(`\n  ${addr.name}:`);
    const result = await post('/orchestrate', {
      address: addr.address,
      businessType: addr.businessType
    });

    result.status === 200
      ? pass(`orchestrate 200 (${result.ms}ms)`)
      : fail('orchestrate', `HTTP ${result.status}: ${JSON.stringify(result.data).slice(0, 200)}`);

    // Check DashboardResponse structure
    if (result.data?.zoning?.data?.zoneName) {
      pass(`zoning: ${result.data.zoning.data.zoneName}`);
    } else {
      fail('orchestrate: missing zoning data');
    }

    if (result.data?.synthesis?.possibleVerdict) {
      pass(`verdict: ${result.data.synthesis.possibleVerdict}, score: ${result.data.synthesis.feasibilityScore}`);
    } else {
      fail('orchestrate: missing synthesis');
    }

    if (result.data?.geocoded?.lat && result.data?.geocoded?.lng) {
      pass(`geocoded: ${result.data.geocoded.lat.toFixed(4)}, ${result.data.geocoded.lng.toFixed(4)}`);
    } else {
      fail('orchestrate: missing geocoded');
    }

    if (result.data?.questions) {
      pass(`questions: ${result.data.questions.length}`);
    } else {
      fail('orchestrate: missing questions');
    }

    result.ms < 30000
      ? pass(`under 30s`)
      : fail('slow', `${(result.ms / 1000).toFixed(1)}s`);
  }

  // 5. Synthesize endpoint
  console.log('\n--- Synthesize ---');
  const zoningForSynth = await post('/zoning', { address: '3025 University Ave, San Diego, CA', businessType: 'bakery' });
  const synthResult = await post('/synthesize', {
    businessType: 'bakery',
    address: '3025 University Ave',
    zoning: zoningForSynth.data,
    competition: null,
    footTraffic: null,
    neighborhood: null,
    permits: null
  });
  synthResult.status === 200 ? pass('synthesize 200') : fail('synthesize', `HTTP ${synthResult.status}`);
  synthResult.data?.synthesis?.possibleVerdict
    ? pass(`synthesis verdict: ${synthResult.data.synthesis.possibleVerdict}`)
    : fail('synthesize: missing verdict');

  // 6. Bad address handling
  console.log('\n--- Bad Addresses ---');
  const badAddr2 = await post('/zoning', { address: '99999 Nonexistent Blvd, San Diego, CA', businessType: 'restaurant' });
  badAddr2.status !== 200
    ? pass(`nonexistent address rejected (${badAddr2.status})`)
    : fail('nonexistent address should fail');

  // 7. Answer endpoint
  console.log('\n--- Answer ---');
  const answerResult = await post('/orchestrate/answer', {
    widgetId: 'startup_capital',
    answer: 'Yes, I have $50k-$100k',
    currentState: {
      businessType: 'bakery with coffee',
      address: '3025 University Ave, San Diego, CA'
    }
  });
  answerResult.status === 200
    ? pass(`answer 200 (${answerResult.ms}ms)`)
    : fail('answer', `HTTP ${answerResult.status}`);
  answerResult.data?.message
    ? pass('returned message')
    : fail('answer: no message');

  // Summary
  console.log('\n========================================');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
