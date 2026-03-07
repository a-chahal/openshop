import { useCallback, useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useBoardStore } from '../store/boardStore'
import { computeLayout, FALLBACK_DIMS, type WidgetDescriptor } from '../lib/layoutEngine'
import type { BoardWidgetData } from '../types'
import type { Node, NodeChange } from '@xyflow/react'

export function useLayoutEngine() {
  const { fitView } = useReactFlow()
  const dimCache = useRef<Record<string, { width: number; height: number }>>({})
  const layoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userDragged = useRef<Set<string>>(new Set())
  const isDragging = useRef(false)

  const scheduleLayout = useCallback(() => {
    if (layoutTimer.current) clearTimeout(layoutTimer.current)
    layoutTimer.current = setTimeout(() => {
      const { nodes, setNodes, dimensionCache } = useBoardStore.getState()
      if (nodes.length === 0) return

      // Build descriptors from store nodes + dimCache
      const descriptors: WidgetDescriptor[] = nodes.map((n: Node<BoardWidgetData>, i: number) => {
        const dims = dimCache.current[n.id]
          ?? dimensionCache[n.id]
          ?? FALLBACK_DIMS[n.data.widgetType]
          ?? { width: 300, height: 200 }
        return {
          id: n.id,
          widgetType: n.data.widgetType,
          width: dims.width,
          height: dims.height,
          spawnOrder: i,
        }
      })

      // Current positions for pinned nodes
      const currentPositions: Record<string, { x: number; y: number }> = {}
      for (const n of nodes) {
        currentPositions[n.id] = n.position
      }

      const newPositions = computeLayout(
        descriptors,
        { viewportWidth: window.innerWidth, viewportHeight: window.innerHeight },
        userDragged.current,
        currentPositions,
      )

      // Only update nodes whose position actually changed
      let changed = false
      const updatedNodes = nodes.map((n: Node<BoardWidgetData>) => {
        const newPos = newPositions[n.id]
        if (!newPos) return n
        const dx = Math.abs(n.position.x - newPos.x)
        const dy = Math.abs(n.position.y - newPos.y)
        if (dx < 1 && dy < 1) return n
        changed = true
        return { ...n, position: newPos }
      })

      if (changed) {
        setNodes(updatedNodes)

        // Fit view after layout settles
        if (fitTimer.current) clearTimeout(fitTimer.current)
        fitTimer.current = setTimeout(() => {
          fitView({ padding: 0.04, maxZoom: 0.7, duration: 400 })
        }, 50)
      }
    }, 60)
  }, [fitView])

  const handleDimensionChanges = useCallback((changes: NodeChange<Node<BoardWidgetData>>[]) => {
    let hasDimensionChange = false

    for (const change of changes) {
      if (change.type === 'dimensions' && 'dimensions' in change && change.dimensions) {
        const dims = change.dimensions as { width: number; height: number }
        if (dims.width > 0 && dims.height > 0) {
          const prev = dimCache.current[change.id]
          if (!prev || Math.abs(prev.width - dims.width) > 2 || Math.abs(prev.height - dims.height) > 2) {
            dimCache.current[change.id] = { width: dims.width, height: dims.height }
            // Persist to store for rehydration
            const { setDimensionCache } = useBoardStore.getState()
            setDimensionCache(change.id, dims.width, dims.height)
            hasDimensionChange = true
          }
        }
      }

      // Track user drags
      if (change.type === 'position' && 'dragging' in change) {
        if (change.dragging) {
          isDragging.current = true
          userDragged.current.add(change.id)
        } else if (isDragging.current) {
          isDragging.current = false
        }
      }
    }

    if (hasDimensionChange && !isDragging.current) {
      scheduleLayout()
    }
  }, [scheduleLayout])

  return { handleDimensionChanges, scheduleLayout, userDragged }
}
