import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw, Trophy } from 'lucide-react'
import { PageHeader } from '../components/AppShell'
import {
  GRID_SIZE,
  PIECE_COUNT,
  PUZZLE_IMAGES,
  VIEWBOX_MARGIN,
  createEdgePattern,
  findJoin,
  piecePath,
  pieceTransform,
  puzzleMetrics,
  randomImage,
  rubberband,
  scaleGroups,
  scatterPieces,
} from '../lib/jigsaw'

function groupMembers(pieces, groupId) {
  return pieces.filter((piece) => piece.groupId === groupId)
}

function groupBounds(group, metrics) {
  return {
    left: Math.min(...group.map((piece) => piece.x)) - metrics.margin,
    top: Math.min(...group.map((piece) => piece.y)) - metrics.margin,
    right: Math.max(...group.map((piece) => piece.x)) + metrics.cell + metrics.margin,
    bottom: Math.max(...group.map((piece) => piece.y)) + metrics.cell + metrics.margin,
  }
}

function JigsawPiece({
  piece,
  image,
  pattern,
  gameId,
  metrics,
  complete,
  dragging,
  keyboardMoving,
  register,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
}) {
  const path = piecePath(piece, pattern)
  const clipId = `jigsaw-${gameId}-${piece.id}`

  return <button
    ref={(node) => register(piece.id, node)}
    type="button"
    className={`jigsaw-piece${dragging ? ' is-dragging' : ''}${keyboardMoving ? ' is-keyboard-moving' : ''}${complete ? ' is-complete' : ''}`}
    style={{
      width: metrics.pieceBox,
      height: metrics.pieceBox,
      transform: pieceTransform(piece, metrics),
      zIndex: piece.z,
    }}
    aria-label={`拼图块 ${piece.id + 1}，方向键移动，靠近相邻块后按回车连接`}
    tabIndex={complete ? -1 : 0}
    onPointerDown={(event) => onPointerDown(event, piece)}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerUp}
    onPointerCancel={onPointerUp}
    onKeyDown={(event) => onKeyDown(event, piece)}
  >
    <svg viewBox={`${-VIEWBOX_MARGIN} ${-VIEWBOX_MARGIN} ${100 + VIEWBOX_MARGIN * 2} ${100 + VIEWBOX_MARGIN * 2}`} aria-hidden="true">
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path d={path} />
        </clipPath>
      </defs>
      <image
        href={image}
        x={piece.column * -100}
        y={piece.row * -100}
        width={GRID_SIZE * 100}
        height={GRID_SIZE * 100}
        preserveAspectRatio="none"
        clipPath={`url(#${clipId})`}
      />
      <path className="jigsaw-piece-outline" d={path} />
    </svg>
  </button>
}

export default function PuzzlePage() {
  const stageRef = useRef(null)
  const pieceRefs = useRef(new Map())
  const dragRef = useRef(null)
  const stageSizeRef = useRef({ width: 0, height: 0 })
  const resetTimerRef = useRef(null)
  const keyboardTimerRef = useRef(null)
  const completionButtonRef = useRef(null)
  const zIndexRef = useRef(PIECE_COUNT + 1)

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const [pieces, setPieces] = useState([])
  const [image, setImage] = useState(() => randomImage())
  const [pattern, setPattern] = useState(createEdgePattern)
  const [gameId, setGameId] = useState(1)
  const [draggingGroup, setDraggingGroup] = useState(null)
  const [keyboardGroup, setKeyboardGroup] = useState(null)
  const [seconds, setSeconds] = useState(0)
  const [started, setStarted] = useState(false)
  const [shuffling, setShuffling] = useState(false)

  const metrics = useMemo(() => puzzleMetrics(stageSize), [stageSize])
  const groups = useMemo(() => {
    const counts = new Map()
    pieces.forEach((piece) => counts.set(piece.groupId, (counts.get(piece.groupId) ?? 0) + 1))
    return counts
  }, [pieces])
  const connected = useMemo(() => Math.max(1, ...groups.values()), [groups])
  const complete = pieces.length === PIECE_COUNT && connected === PIECE_COUNT

  useEffect(() => {
    PUZZLE_IMAGES.forEach((source) => {
      const preload = new Image()
      preload.src = source
    })
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined
    const observer = new ResizeObserver(([entry]) => {
      const nextSize = {
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      }
      if (!nextSize.width || !nextSize.height) return
      const previousSize = stageSizeRef.current
      stageSizeRef.current = nextSize
      setStageSize(nextSize)
      setPieces((current) => current.length
        ? scaleGroups(current, previousSize, nextSize)
        : scatterPieces(nextSize))
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started || complete) return undefined
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => clearInterval(timer)
  }, [complete, started])

  useEffect(() => {
    if (complete) completionButtonRef.current?.focus()
  }, [complete])

  useEffect(() => () => {
    clearTimeout(resetTimerRef.current)
    clearTimeout(keyboardTimerRef.current)
  }, [])

  const registerPiece = useCallback((id, node) => {
    if (node) pieceRefs.current.set(id, node)
    else pieceRefs.current.delete(id)
  }, [])

  const restart = useCallback(() => {
    const size = stageSizeRef.current
    if (!size.width || shuffling) return
    setShuffling(true)
    clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      setImage((current) => randomImage(current))
      setPattern(createEdgePattern())
      setPieces(scatterPieces(size))
      setGameId((value) => value + 1)
      setDraggingGroup(null)
      setKeyboardGroup(null)
      setSeconds(0)
      setStarted(false)
      zIndexRef.current = PIECE_COUNT + 1
      requestAnimationFrame(() => setShuffling(false))
    }, 130)
  }, [shuffling])

  const handlePointerDown = (event, piece) => {
    if (complete || event.button !== 0 || dragRef.current) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const group = groupMembers(pieces, piece.groupId)
    const bounds = groupBounds(group, metrics)
    const nextZ = zIndexRef.current + 1
    zIndexRef.current = nextZ
    setPieces((current) => current.map((item) => item.groupId === piece.groupId ? { ...item, z: nextZ } : item))
    setDraggingGroup(piece.groupId)
    setStarted(true)
    dragRef.current = {
      pointerId: event.pointerId,
      groupId: piece.groupId,
      ids: group.map((item) => item.id),
      bases: new Map(group.map((item) => [item.id, { x: item.x, y: item.y }])),
      startX: event.clientX,
      startY: event.clientY,
      bounds,
      dx: 0,
      dy: 0,
    }
  }

  const handlePointerMove = (event) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const rawDx = event.clientX - drag.startX
    const rawDy = event.clientY - drag.startY
    const minDx = -drag.bounds.left
    const maxDx = stageSize.width - drag.bounds.right
    const minDy = -drag.bounds.top
    const maxDy = stageSize.height - drag.bounds.bottom
    const dampingRange = Math.max(90, metrics.cell * 1.6)
    const dx = rubberband(rawDx, minDx, maxDx, dampingRange)
    const dy = rubberband(rawDy, minDy, maxDy, dampingRange)
    drag.dx = dx
    drag.dy = dy

    drag.ids.forEach((id) => {
      const node = pieceRefs.current.get(id)
      const base = drag.bases.get(id)
      if (!node || !base) return
      node.style.transform = `translate3d(${base.x + dx - metrics.margin}px, ${base.y + dy - metrics.margin}px, 0)`
    })
  }

  const finishDrag = (event) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const minDx = -drag.bounds.left
    const maxDx = stageSize.width - drag.bounds.right
    const minDy = -drag.bounds.top
    const maxDy = stageSize.height - drag.bounds.bottom
    const dx = Math.min(maxDx, Math.max(minDx, drag.dx))
    const dy = Math.min(maxDy, Math.max(minDy, drag.dy))

    setPieces((current) => {
      let next = current.map((piece) => drag.ids.includes(piece.id)
        ? { ...piece, x: drag.bases.get(piece.id).x + dx, y: drag.bases.get(piece.id).y + dy }
        : piece)
      const join = findJoin(drag.ids, next, metrics.cell)
      if (join) {
        next = next.map((piece) => drag.ids.includes(piece.id)
          ? {
            ...piece,
            x: piece.x + join.dx,
            y: piece.y + join.dy,
            groupId: join.targetGroupId,
          }
          : piece)
      }
      return next
    })

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    setDraggingGroup(null)
  }

  const handleKeyDown = (event, piece) => {
    if (complete) return
    const step = event.shiftKey ? 24 : 10
    const directions = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }

    if (directions[event.key]) {
      event.preventDefault()
      const [requestedX, requestedY] = directions[event.key]
      const group = groupMembers(pieces, piece.groupId)
      const bounds = groupBounds(group, metrics)
      const dx = Math.min(stageSize.width - bounds.right, Math.max(-bounds.left, requestedX))
      const dy = Math.min(stageSize.height - bounds.bottom, Math.max(-bounds.top, requestedY))
      setPieces((current) => current.map((item) => item.groupId === piece.groupId
        ? { ...item, x: item.x + dx, y: item.y + dy }
        : item))
      setStarted(true)
      setKeyboardGroup(piece.groupId)
      clearTimeout(keyboardTimerRef.current)
      keyboardTimerRef.current = setTimeout(() => setKeyboardGroup(null), 80)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const ids = groupMembers(pieces, piece.groupId).map((item) => item.id)
      setPieces((current) => {
        const join = findJoin(ids, current, metrics.cell)
        if (!join) return current
        return current.map((item) => ids.includes(item.id)
          ? { ...item, x: item.x + join.dx, y: item.y + join.dy, groupId: join.targetGroupId }
          : item)
      })
    }
  }

  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return <div className="page-pad puzzle-page">
    <PageHeader title="骇爪美图" description="拖动拼图块自由拼合，靠近正确位置会自动吸附。" />
    <main className="jigsaw-layout">
      <section
        ref={stageRef}
        className={`jigsaw-stage${shuffling ? ' is-shuffling' : ''}${complete ? ' is-complete' : ''}`}
        aria-label="四乘四自由摆放图片拼图"
      >
        <div className="jigsaw-stage-corners" aria-hidden="true"><i /><i /><i /><i /></div>
        {pieces.map((piece) => <JigsawPiece
          key={piece.id}
          piece={piece}
          image={image}
          pattern={pattern}
          gameId={gameId}
          metrics={metrics}
          complete={complete}
          dragging={draggingGroup === piece.groupId}
          keyboardMoving={keyboardGroup === piece.groupId}
          register={registerPiece}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onKeyDown={handleKeyDown}
        />)}

        {complete && <div className="jigsaw-complete" role="status">
          <Trophy />
          <h2>拼图完成</h2>
          <p>{time}</p>
          <button ref={completionButtonRef} type="button" onClick={restart}>再来一张</button>
        </div>}
      </section>

      <section className="jigsaw-controls" aria-label="拼图状态">
        <dl>
          <div><dt>用时</dt><dd>{time}</dd></div>
          <div><dt>已连接</dt><dd aria-live="polite">{connected}/{PIECE_COUNT}</dd></div>
        </dl>
        <button type="button" className="secondary-button" onClick={restart} disabled={shuffling}>
          <RotateCcw />重新打乱
        </button>
      </section>
    </main>
  </div>
}
