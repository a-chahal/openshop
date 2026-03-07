import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

interface ZoningTable {
  commercial: Record<string, Record<string, string>>;
  residential: Record<string, Record<string, string>>;
  industrial: Record<string, Record<string, string>>;
  use_category_mapping: Record<string, string[]>;
  footnotes: Record<string, string>;
}

let cachedTable: ZoningTable | null = null;

function getTable(): ZoningTable {
  if (cachedTable) return cachedTable;
  const __dirname = dirname(fileURLToPath(import.meta.url));
  cachedTable = JSON.parse(readFileSync(join(__dirname, '../../data/sd_zoning_complete.json'), 'utf-8'));
  return cachedTable!;
}

export type ZoneCategory = 'commercial' | 'residential' | 'industrial' | 'mixed' | 'unknown';
export type UseDesignation = 'P' | 'L' | 'N' | 'C' | '-' | 'unknown';

export interface ZoneVerdict {
  category: ZoneCategory;
  verdict: string;
}

export interface DetailedZoneVerdict extends ZoneVerdict {
  designation: UseDesignation;
  designationMeaning: string;
}

const DESIGNATION_MEANINGS: Record<string, string> = {
  'P': 'Permitted — this use is allowed by right, no special approval needed',
  'L': 'Limited — this use is allowed with specific conditions or limitations',
  'N': 'Not Permitted — this use requires a Neighborhood Use Permit for approval',
  'C': 'Conditional — this use requires a Conditional Use Permit (CUP)',
  '-': 'Not Allowed — this use is not permitted in this zone',
};

export function lookupZonePrefix(zoneName: string): ZoneVerdict {
  const upper = zoneName.toUpperCase();
  const prefix = upper.split('-')[0];

  // Planned district overlays — check full zone name first
  if (upper.startsWith('CCPD')) return { category: 'commercial', verdict: 'Centre City Planned District — downtown mixed-use, most commercial uses permitted' };
  if (upper.startsWith('CUPD')) return { category: 'commercial', verdict: 'Community Plan Planned District — commercial uses generally permitted with conditions' };
  if (upper.startsWith('MHPD')) return { category: 'commercial', verdict: 'Mid-City Planned District — commercial and mixed-use' };
  if (upper.startsWith('OTPD')) return { category: 'commercial', verdict: 'Old Town Planned District — visitor-commercial and retail' };
  if (upper.startsWith('LHPD')) return { category: 'commercial', verdict: 'La Jolla Shores Planned District — commercial uses with conditions' };
  if (upper.startsWith('MCCPD')) return { category: 'commercial', verdict: 'Mission Center Planned District — regional commercial' };
  if (upper.startsWith('PVPD')) return { category: 'mixed', verdict: 'Planned Village District — mixed-use, commercial generally permitted' };

  const prefixMap: Record<string, ZoneVerdict> = {
    'CN': { category: 'commercial', verdict: 'Commercial Neighborhood — most retail/service businesses permitted' },
    'CC': { category: 'commercial', verdict: 'Commercial Community — wide range of commercial uses permitted' },
    'CV': { category: 'commercial', verdict: 'Commercial Visitor — visitor-serving commercial, restaurants/retail typically permitted' },
    'CO': { category: 'commercial', verdict: 'Commercial Office — office and limited retail permitted' },
    'CR': { category: 'commercial', verdict: 'Commercial Regional — large-scale commercial permitted' },
    'CP': { category: 'commercial', verdict: 'Commercial Professional — professional offices and limited commercial' },
    'RS': { category: 'residential', verdict: 'Residential Single-Family — most commercial uses not permitted' },
    'RE': { category: 'residential', verdict: 'Residential Estate — most commercial uses not permitted' },
    'RM': { category: 'residential', verdict: 'Residential Multi-Family — limited commercial may be permitted with CUP' },
    'RT': { category: 'residential', verdict: 'Residential Townhouse — most commercial uses not permitted' },
    'RX': { category: 'mixed', verdict: 'Residential Mixed — some commercial uses may be permitted' },
    'IP': { category: 'industrial', verdict: 'Industrial Park — manufacturing and industrial uses' },
    'IL': { category: 'industrial', verdict: 'Industrial Light — light manufacturing, some commercial' },
    'IH': { category: 'industrial', verdict: 'Industrial Heavy — heavy industrial uses' },
    'IS': { category: 'industrial', verdict: 'Industrial Small Lot — small-scale industrial and commercial' },
    'OF': { category: 'commercial', verdict: 'Office — professional and business offices' },
  };
  return prefixMap[prefix] ?? {
    category: 'unknown',
    verdict: `Zone ${zoneName} — unable to determine permitted uses from prefix alone`
  };
}

export function lookupZoneUse(zoneName: string, useCategory: string): DetailedZoneVerdict {
  const table = getTable();
  const baseVerdict = lookupZonePrefix(zoneName);

  // Search across all zone type sections
  for (const section of ['commercial', 'residential', 'industrial'] as const) {
    const zoneData = table[section]?.[zoneName];
    if (zoneData) {
      const designation = zoneData[useCategory];
      if (designation && designation !== '-') {
        return {
          category: section,
          designation: designation as UseDesignation,
          designationMeaning: DESIGNATION_MEANINGS[designation] ?? `Unknown designation: ${designation}`,
          verdict: `${zoneName} — ${useCategory.replace(/_/g, ' ')}: ${DESIGNATION_MEANINGS[designation] ?? designation}`
        };
      }
      // Found zone but use is '-' (not allowed)
      if (designation === '-') {
        return {
          category: section,
          designation: '-',
          designationMeaning: DESIGNATION_MEANINGS['-'],
          verdict: `${zoneName} — ${useCategory.replace(/_/g, ' ')}: Not allowed in this zone`
        };
      }
      // Found zone but use category not in table
      return {
        ...baseVerdict,
        designation: 'unknown',
        designationMeaning: 'Use category not found in zoning table'
      };
    }
  }

  // Zone not found in any section
  return {
    ...baseVerdict,
    designation: 'unknown',
    designationMeaning: 'Zone not found in zoning table — using prefix-based estimate'
  };
}
