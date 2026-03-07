import type { WidgetType } from '../types'

// --- Semantic groups: widgets cluster by theme ---

const GROUPS = ['identity', 'market', 'neighborhood', 'outcomes', 'questions'] as const
type SemanticGroup = (typeof GROUPS)[number]

const WIDGET_GROUP_MAP: Record<string, SemanticGroup> = {
  zoning: 'identity',
  competition: 'market',
  footTraffic: 'market',
  safety: 'neighborhood',
  responsiveness: 'neighborhood',
  streets: 'neighborhood',
  permits: 'outcomes',
  synthesis: 'outcomes',
}

export function resolveGroup(widgetId: string): SemanticGroup {
  return WIDGET_GROUP_MAP[widgetId] ?? 'questions'
}

// --- Fallback dimensions (before measurement / on rehydration) ---

export const FALLBACK_DIMS: Record<WidgetType, { width: number; height: number }> = {
  verdict: { width: 300, height: 280 },
  metric: { width: 280, height: 180 },
  list: { width: 300, height: 320 },
  chart: { width: 300, height: 300 },
  timeline: { width: 300, height: 300 },
  narrative: { width: 360, height: 400 },
  input: { width: 280, height: 140 },
}

// --- Types ---

export interface WidgetDescriptor {
  id: string
  widgetType: WidgetType
  width: number
  height: number
  spawnOrder: number
}

export interface LayoutConfig {
  viewportWidth: number
  viewportHeight?: number
  gap?: number
  colWidth?: number
}

// --- Row assignments: merge semantic groups into wide horizontal rows ---
// Row 0 (top):    competition, zoning, footTraffic
// Row 1 (middle): safety, responsiveness, streets, permits
// Row 2 (bottom): synthesis, question(s)

const ROW_ASSIGNMENTS: Record<string, number> = {
  competition: 0,
  zoning: 0,
  footTraffic: 0,
  safety: 1,
  responsiveness: 1,
  streets: 1,
  permits: 1,
}
// synthesis and questions default to row 2

const ROW_ORDER: Record<string, number> = {
  competition: 0,
  zoning: 1,
  footTraffic: 2,
  safety: 0,
  responsiveness: 1,
  streets: 2,
  permits: 3,
  synthesis: 0,
}

function getRow(id: string): number {
  if (id in ROW_ASSIGNMENTS) return ROW_ASSIGNMENTS[id]
  return 2 // synthesis + all questions go to row 2
}

function getOrderInRow(id: string): number {
  if (id in ROW_ORDER) return ROW_ORDER[id]
  // Questions: place after synthesis, ordered by ID
  return 100 + id.charCodeAt(0)
}

// --- Layout algorithm: wide centered rows that fill the visible canvas ---

export function computeLayout(
  widgets: WidgetDescriptor[],
  config: LayoutConfig,
  pinnedIds?: Set<string>,
  currentPositions?: Record<string, { x: number; y: number }>,
): Record<string, { x: number; y: number }> {
  const minSpacing = config.colWidth ?? 370

  // 1. Bucket widgets into rows
  const rows = new Map<number, WidgetDescriptor[]>()
  for (const w of widgets) {
    if (pinnedIds?.has(w.id)) continue
    const row = getRow(w.id)
    if (!rows.has(row)) rows.set(row, [])
    rows.get(row)!.push(w)
  }

  for (const [, list] of rows) {
    list.sort((a, b) => getOrderInRow(a.id) - getOrderInRow(b.id))
  }

  const sortedRowKeys = Array.from(rows.keys()).sort((a, b) => a - b)
  if (sortedRowKeys.length === 0) return {}

  // 2. Compute effective canvas area — layout fills this space
  //    Use a target zoom of 0.7 so layout is sized for a readable zoom level
  const targetZoom = 0.7
  const canvasW = config.viewportWidth / targetZoom
  const canvasH = (config.viewportHeight ?? config.viewportWidth * 0.55) / targetZoom
  const usableW = canvasW * 0.92 // 4% padding each side
  const usableH = canvasH * 0.88

  // 3. Compute horizontal spacing per row — fill available width
  const maxRowSize = Math.max(...Array.from(rows.values()).map(r => r.length))
  const horizontalSpacing = Math.max(minSpacing, usableW / maxRowSize)

  // 4. Compute row heights and vertical spacing
  const rowHeights: Record<number, number> = {}
  for (const rowIdx of sortedRowKeys) {
    const list = rows.get(rowIdx)!
    rowHeights[rowIdx] = Math.max(...list.map(w => w.height))
  }

  // Distribute rows to fill vertical space, but cap row gap to keep it reasonable
  let totalRowHeight = 0
  for (const key of sortedRowKeys) totalRowHeight += rowHeights[key]
  const remainingV = usableH - totalRowHeight
  const rowGap = Math.max(40, Math.min(120, remainingV / Math.max(1, sortedRowKeys.length - 1)))

  let totalHeight = totalRowHeight + rowGap * (sortedRowKeys.length - 1)

  // 5. Place widgets — centered at (0, 0)
  const positions: Record<string, { x: number; y: number }> = {}
  let currentY = -totalHeight / 2

  for (const rowIdx of sortedRowKeys) {
    const list = rows.get(rowIdx)!

    // Center this row: compute row-specific spacing
    const rowSpacing = Math.max(minSpacing, usableW / list.length)
    const rowWidth = list.length * rowSpacing
    const startX = -rowWidth / 2

    for (let i = 0; i < list.length; i++) {
      const w = list[i]
      positions[w.id] = {
        x: startX + i * rowSpacing + (rowSpacing - (w.width || 320)) / 2,
        y: currentY,
      }
    }

    currentY += rowHeights[rowIdx] + rowGap
  }

  // 6. Preserve pinned (user-dragged) positions
  if (pinnedIds && currentPositions) {
    for (const id of pinnedIds) {
      if (currentPositions[id]) {
        positions[id] = currentPositions[id]
      }
    }
  }

  return positions
}
