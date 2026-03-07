import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { llmJSON } from './client.js';
import type { TraceContext } from '../telemetry/trace.js';

export interface BusinessMapping {
  primaryCategory: string;
  secondaryCategories: string[];
  naicsCodes: number[];
  description: string;
}

let cachedCategoryKeys: string[] | null = null;

function getCategoryKeys(): string[] {
  if (cachedCategoryKeys) return cachedCategoryKeys;
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const data = JSON.parse(readFileSync(join(__dirname, '../../data/sd_zoning_complete.json'), 'utf-8'));
  cachedCategoryKeys = Object.keys(data.use_category_mapping);
  return cachedCategoryKeys;
}

export async function mapBusinessType(ctx: TraceContext, businessDescription: string): Promise<BusinessMapping> {
  const categoryKeys = getCategoryKeys();

  return llmJSON<BusinessMapping>(ctx, 'businessMapper', `
Given this business description, map it to San Diego zoning use categories and NAICS codes.

Business: "${businessDescription}"

Valid use category keys (pick from ONLY these):
${categoryKeys.join('\n')}

Return JSON:
{
  "primaryCategory": "the single best matching use category key from the list above",
  "secondaryCategories": ["0-2 additional relevant category keys from the list above"],
  "naicsCodes": [both 6-digit specific codes AND 4-digit industry group codes for ALL competitor types],
  "description": "clean normalized 2-4 word business description"
}

Important:
- primaryCategory MUST be one of the exact keys listed above
- For a bakery, use "eating_drinking_establishments" not "food_beverages_groceries"
- naicsCodes must include BOTH specific 6-digit codes AND broader 4-digit industry group codes
- Include 4-digit codes for ALL types of businesses that would compete for the same customers
- Example for "bakery with coffee": [311811, 3118, 3119, 7222, 4452] — covers retail bakeries (311811), bakery manufacturing (3118), coffee/tea manufacturing (3119), cafes/snack bars/limited-service (7222), and specialty food stores (4452)
- Do NOT include 7224 (bars) or 7223 (caterers) unless the business is a bar or caterer
- Return ONLY valid JSON, no explanation`,
    'You are a business classification expert. Return only valid JSON.');
}
