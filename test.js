import 'dotenv/config';
import { createTrace } from './src/telemetry/trace.js';
import { mapBusinessType } from './src/llm/business-mapper.js';
import { checkZoning } from './src/tools/checkZoning.js';
import { competitiveLandscape } from './src/tools/competitiveLandscape.js';
import { footTraffic } from './src/tools/footTraffic.js';
import { permitRoadmap } from './src/tools/permitRoadmap.js';
import { neighborhoodProfile } from './src/tools/neighborhoodProfile.js';
import { orchestrate } from './src/llm/orchestrator.js';
const ADDRESS = '3025 University Ave, San Diego, CA';
const BUSINESS_TYPE = 'bakery with coffee';
async function main() {
    const ctx = createTrace(ADDRESS, BUSINESS_TYPE);
    console.log(`\n=== OpenShop Stage 2 Test — Trace ${ctx.traceId.slice(0, 8)} ===\n`);
    // 1. Test business mapper
    console.log('--- Business Mapper ---');
    const mapping = await mapBusinessType(ctx, BUSINESS_TYPE);
    console.log('  Primary:', mapping.primaryCategory);
    console.log('  Secondary:', mapping.secondaryCategories);
    console.log('  NAICS:', mapping.naicsCodes);
    console.log('  Description:', mapping.description);
    // 2. Test enhanced checkZoning with narrative
    console.log('\n--- Tool: checkZoning (with narrative) ---');
    const zoningResult = await checkZoning(ctx, ADDRESS, BUSINESS_TYPE);
    console.log('  Glow:', zoningResult.glowColor);
    console.log('  Zone:', zoningResult.data.zoneName);
    console.log('  Use category:', zoningResult.data.useCategory);
    console.log('  Designation:', zoningResult.data.designation, '-', zoningResult.data.designationMeaning);
    console.log('  Narrative:', zoningResult.narrative);
    // 3. Test other tools with narratives
    const geo = zoningResult.data.location;
    const cp = zoningResult.data.communityPlan;
    console.log('\n--- Tool: competitiveLandscape (with narrative) ---');
    const compResult = await competitiveLandscape(ctx, geo.lat, geo.lng, mapping.naicsCodes, 0.5, BUSINESS_TYPE, ADDRESS);
    console.log('  Glow:', compResult.glowColor);
    console.log(`  Competitors: ${compResult.data.count}`);
    console.log('  Narrative:', compResult.narrative);
    console.log('\n--- Tool: footTraffic (with narrative) ---');
    const trafficResult = await footTraffic(ctx, geo.lat, geo.lng, 0.3, BUSINESS_TYPE, ADDRESS);
    console.log('  Glow:', trafficResult.glowColor);
    console.log(`  % of citywide avg: ${trafficResult.data.pctOfCitywideAvg}%`);
    console.log('  Narrative:', trafficResult.narrative);
    console.log('\n--- Tool: permitRoadmap (with narrative) ---');
    const permitResult = await permitRoadmap(ctx, geo.lat, geo.lng, cp, [BUSINESS_TYPE], BUSINESS_TYPE, ADDRESS);
    console.log('  Glow:', permitResult.glowColor);
    console.log(`  Median: ${permitResult.data.medianDays}d`);
    console.log('  Narrative:', permitResult.narrative);
    console.log('\n--- Tool: neighborhoodProfile (with narrative) ---');
    const hoodResult = await neighborhoodProfile(ctx, geo.lat, geo.lng, cp, BUSINESS_TYPE, ADDRESS);
    console.log('  Glow:', hoodResult.glowColor);
    console.log('  Narrative:', hoodResult.narrative);
    // 4. Test full orchestrator
    console.log('\n\n========================================');
    console.log('=== FULL ORCHESTRATOR TEST ===');
    console.log('========================================\n');
    const result = await orchestrate(BUSINESS_TYPE, ADDRESS);
    console.log(`\nTrace: ${result.traceId.slice(0, 8)}`);
    console.log(`Community: ${result.communityPlan}`);
    console.log(`Zone: ${result.zoneName}`);
    console.log(`Total actions: ${result.actions.length}\n`);
    for (const action of result.actions) {
        if (action.type === 'spawn_widget') {
            console.log(`  [WIDGET] ${action.widgetId} (${action.widgetType}) — ${action.glowColor}`);
            if (action.narrative)
                console.log(`    "${action.narrative.substring(0, 120)}..."`);
        }
        else if (action.type === 'add_connection') {
            console.log(`  [CONN] ${action.sourceId} → ${action.targetId}: ${action.label}`);
        }
        else if (action.type === 'ask_question') {
            console.log(`  [Q] ${action.question} (${action.inputType})`);
        }
        else if (action.type === 'set_phase') {
            console.log(`  [PHASE] ${action.data}`);
        }
    }
    const totalDuration = Date.now() - ctx.startTime;
    console.log(`\n=== Done in ${totalDuration}ms ===\n`);
    process.exit(0);
}
main().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
//# sourceMappingURL=test.js.map