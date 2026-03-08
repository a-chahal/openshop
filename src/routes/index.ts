import { Router } from 'express';
import { createTrace } from '../telemetry/trace.js';
import type { TraceContext } from '../telemetry/trace.js';
import { geocode, getCommunityPlan } from '../data/arcgis.js';
import { mapBusinessType } from '../llm/business-mapper.js';
import { orchestrate, parseIntent, generateStructuredSynthesis, selectFollowUpQuestions } from '../llm/orchestrator.js';
import { checkZoning } from '../tools/checkZoning.js';
import { competitiveLandscape } from '../tools/competitiveLandscape.js';
import { footTraffic } from '../tools/footTraffic.js';
import { permitRoadmap } from '../tools/permitRoadmap.js';
import { neighborhoodProfile } from '../tools/neighborhoodProfile.js';
import { llm } from '../llm/client.js';

export const router = Router();

// Helper: geocode + community plan for individual tool endpoints
async function geoAndCommunity(ctx: TraceContext, address: string) {
  const geo = await geocode(ctx, address);
  const community = await getCommunityPlan(ctx, geo.lat, geo.lng);
  return { geo, communityName: community.cpName };
}

// GET /api/health
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/parse-intent — extract business type + address from natural language
router.post('/parse-intent', async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }
    const result = await parseIntent(message);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/orchestrate — main entry point, returns DashboardResponse
router.post('/orchestrate', async (req, res, next) => {
  try {
    const { businessType, address } = req.body;
    if (!businessType || !address) {
      res.status(400).json({ error: 'businessType and address are required' });
      return;
    }
    const result = await orchestrate(businessType, address);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/orchestrate/answer — follow-up question answer
router.post('/orchestrate/answer', async (req, res, next) => {
  try {
    const { widgetId, answer, currentState } = req.body;
    if (!widgetId || answer === undefined || !currentState) {
      res.status(400).json({ error: 'widgetId, answer, and currentState are required' });
      return;
    }
    const { businessType, address } = currentState;
    const ctx = createTrace(address, businessType);

    const response = await llm(ctx, 'answerUpdate', {
      systemPrompt: 'You update business location assessment notes based on new user input. Write 1-3 sentences in plain conversational English.',
      prompt: `The user was asked "${widgetId}" and answered: ${JSON.stringify(answer)}.\nBusiness: ${businessType}\nLocation: ${address}\n\nWrite a brief updated assessment note incorporating this answer.`
    });

    res.json({ message: response });
  } catch (err) {
    next(err);
  }
});

// POST /api/synthesize — generate synthesis from tool results
router.post('/synthesize', async (req, res, next) => {
  try {
    const { businessType, address, zoning, competition, footTraffic, neighborhood, permits } = req.body;
    if (!businessType || !address || !zoning) {
      res.status(400).json({ error: 'businessType, address, and zoning are required' });
      return;
    }
    const ctx = createTrace(address, businessType);
    const [synthesis, followUps] = await Promise.all([
      generateStructuredSynthesis(ctx, businessType, address, {
        zoning, competition, traffic: footTraffic, hood: neighborhood, permits
      }),
      selectFollowUpQuestions(ctx, businessType, zoning, competition, footTraffic, address)
    ]);
    res.json({ synthesis, questions: followUps });
  } catch (err) {
    next(err);
  }
});

// --- Individual tool endpoints (unchanged) ---

// POST /api/zoning
router.post('/zoning', async (req, res, next) => {
  try {
    const { address, businessType } = req.body;
    if (!address || !businessType) {
      res.status(400).json({ error: 'address and businessType are required' });
      return;
    }
    const ctx = createTrace(address, businessType);
    const result = await checkZoning(ctx, address, businessType);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/competition
router.post('/competition', async (req, res, next) => {
  try {
    const { address, businessType, radiusMiles } = req.body;
    if (!address || !businessType) {
      res.status(400).json({ error: 'address and businessType are required' });
      return;
    }
    const ctx = createTrace(address, businessType);
    const { geo } = await geoAndCommunity(ctx, address);
    const mapping = await mapBusinessType(ctx, businessType);
    const result = await competitiveLandscape(
      ctx, geo.lat, geo.lng, mapping.naicsCodes, radiusMiles ?? 0.5, businessType, address
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/traffic
router.post('/traffic', async (req, res, next) => {
  try {
    const { address, radiusMiles } = req.body;
    if (!address) {
      res.status(400).json({ error: 'address is required' });
      return;
    }
    const ctx = createTrace(address, '');
    const { geo } = await geoAndCommunity(ctx, address);
    const result = await footTraffic(ctx, geo.lat, geo.lng, radiusMiles ?? 0.3, '', address);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/permits
router.post('/permits', async (req, res, next) => {
  try {
    const { address, businessType } = req.body;
    if (!address || !businessType) {
      res.status(400).json({ error: 'address and businessType are required' });
      return;
    }
    const ctx = createTrace(address, businessType);
    const { geo, communityName } = await geoAndCommunity(ctx, address);
    const result = await permitRoadmap(
      ctx, geo.lat, geo.lng, communityName, [businessType], businessType, address
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/neighborhood
router.post('/neighborhood', async (req, res, next) => {
  try {
    const { address } = req.body;
    if (!address) {
      res.status(400).json({ error: 'address is required' });
      return;
    }
    const ctx = createTrace(address, '');
    const { geo, communityName } = await geoAndCommunity(ctx, address);
    const result = await neighborhoodProfile(ctx, geo.lat, geo.lng, communityName, '', address);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
