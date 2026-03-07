import { useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  type NodeTypes,
  type EdgeTypes,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useBoardStore } from '../store/boardStore'
import { BoardWidget } from '../components/board/BoardWidget'
import { InsightEdge } from '../components/board/InsightEdge'
import { Avatar } from '../components/board/Avatar'
import { EntryScreen } from '../components/board/EntryScreen'
import { CollapsedPills } from '../components/board/CollapsedPills'
import { LocationMap } from '../components/board/LocationMap'
import { useLayoutEngine } from '../hooks/useLayoutEngine'

const nodeTypes: NodeTypes = {
  boardWidget: BoardWidget,
}

const edgeTypes: EdgeTypes = {
  insightEdge: InsightEdge,
}

function BoardCanvas() {
  const nodes = useBoardStore(s => s.nodes)
  const edges = useBoardStore(s => s.edges)
  const phase = useBoardStore(s => s.phase)
  const setNodes = useBoardStore(s => s.setNodes)
  const setEdges = useBoardStore(s => s.setEdges)
  const prevNodeCount = useRef(0)
  const { handleDimensionChanges, scheduleLayout } = useLayoutEngine()

  // Re-layout when new nodes are added
  useEffect(() => {
    if (nodes.length > 0 && nodes.length !== prevNodeCount.current) {
      prevNodeCount.current = nodes.length
      scheduleLayout()
    }
  }, [nodes.length, scheduleLayout])

  const onNodesChange = useCallback((changes: any) => {
    // Allow dragging — apply position changes manually
    const updated = [...nodes]
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        const idx = updated.findIndex(n => n.id === change.id)
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], position: change.position }
        }
      }
    }
    if (changes.some((c: any) => c.type === 'position' && c.position)) {
      setNodes(updated)
    }

    // Feed dimension changes to layout engine
    handleDimensionChanges(changes)
  }, [nodes, setNodes, handleDimensionChanges])

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden">
      {/* Dot grid background */}
      <div className="absolute inset-0 board-canvas" />

      {/* Radial vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-5"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(6,6,10,0.6) 100%)',
        }}
      />

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        fitView
        fitViewOptions={{ padding: 0.04, maxZoom: 0.7 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className="!bg-transparent"
        defaultEdgeOptions={{ type: 'insightEdge' }}
      >
        <Avatar />
      </ReactFlow>

      {/* Overlay: Entry screen or collapsed pills + map */}
      {phase === 'entry' ? (
        <EntryScreen />
      ) : (
        <>
          <CollapsedPills />
          <LocationMap />
        </>
      )}
    </div>
  )
}

export function BoardApp() {
  return (
    <ReactFlowProvider>
      <BoardCanvas />
    </ReactFlowProvider>
  )
}
