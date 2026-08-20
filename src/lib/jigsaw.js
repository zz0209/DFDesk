export const GRID_SIZE = 4
export const PIECE_COUNT = GRID_SIZE * GRID_SIZE
export const VIEWBOX_MARGIN = 22

export const PUZZLE_IMAGES = [
  '/assets/puzzle/hackclaw-command.webp',
  '/assets/puzzle/hackclaw-rooftop.webp',
  '/assets/puzzle/hackclaw-server-vault.webp',
  '/assets/puzzle/hackclaw-transit.webp',
]

export function randomImage(currentImage) {
  const choices = PUZZLE_IMAGES.filter((image) => image !== currentImage)
  return choices[Math.floor(Math.random() * choices.length)] ?? PUZZLE_IMAGES[0]
}

export function createEdgePattern() {
  return {
    vertical: Array.from({ length: GRID_SIZE * (GRID_SIZE - 1) }, () => Math.random() > 0.5 ? 1 : -1),
    horizontal: Array.from({ length: (GRID_SIZE - 1) * GRID_SIZE }, () => Math.random() > 0.5 ? 1 : -1),
  }
}

function pieceEdges(piece, pattern) {
  const { row, column } = piece
  return {
    top: row === 0 ? 0 : -pattern.horizontal[(row - 1) * GRID_SIZE + column],
    right: column === GRID_SIZE - 1 ? 0 : pattern.vertical[row * (GRID_SIZE - 1) + column],
    bottom: row === GRID_SIZE - 1 ? 0 : pattern.horizontal[row * GRID_SIZE + column],
    left: column === 0 ? 0 : -pattern.vertical[row * (GRID_SIZE - 1) + column - 1],
  }
}

export function piecePath(piece, pattern) {
  const edges = pieceEdges(piece, pattern)
  const topY = edges.top * -20
  const rightX = 100 + edges.right * 20
  const bottomY = 100 + edges.bottom * 20
  const leftX = edges.left * -20

  let path = 'M 0 0'
  path += edges.top === 0
    ? ' L 100 0'
    : ` L 35 0 C 42 0 43 ${topY * .25} 43 ${topY * .45} C 43 ${topY * .78} 46 ${topY} 50 ${topY} C 54 ${topY} 57 ${topY * .78} 57 ${topY * .45} C 57 ${topY * .25} 58 0 65 0 L 100 0`
  path += edges.right === 0
    ? ' L 100 100'
    : ` L 100 35 C 100 42 ${100 + edges.right * 5} 43 ${100 + edges.right * 9} 43 C ${100 + edges.right * 15.5} 43 ${rightX} 46 ${rightX} 50 C ${rightX} 54 ${100 + edges.right * 15.5} 57 ${100 + edges.right * 9} 57 C ${100 + edges.right * 5} 57 100 58 100 65 L 100 100`
  path += edges.bottom === 0
    ? ' L 0 100'
    : ` L 65 100 C 58 100 57 ${100 + edges.bottom * 5} 57 ${100 + edges.bottom * 9} C 57 ${100 + edges.bottom * 15.5} 54 ${bottomY} 50 ${bottomY} C 46 ${bottomY} 43 ${100 + edges.bottom * 15.5} 43 ${100 + edges.bottom * 9} C 43 ${100 + edges.bottom * 5} 42 100 35 100 L 0 100`
  path += edges.left === 0
    ? ' L 0 0'
    : ` L 0 65 C 0 58 ${edges.left * -5} 57 ${edges.left * -9} 57 C ${edges.left * -15.5} 57 ${leftX} 54 ${leftX} 50 C ${leftX} 46 ${edges.left * -15.5} 43 ${edges.left * -9} 43 C ${edges.left * -5} 43 0 42 0 35 L 0 0`
  return `${path} Z`
}

export function puzzleMetrics(stage) {
  const compact = stage.width < 600
  const boardSize = Math.min(
    compact ? stage.width * .74 : stage.width * .52,
    compact ? stage.height * .48 : stage.height * .74,
    520,
  )
  const cell = boardSize / GRID_SIZE
  const margin = cell * (VIEWBOX_MARGIN / 100)
  return { cell, margin, pieceBox: cell + margin * 2 }
}

export function scatterPieces(stage) {
  const { cell, margin } = puzzleMetrics(stage)
  const minX = margin
  const minY = margin
  const maxX = Math.max(minX, stage.width - cell - margin)
  const maxY = Math.max(minY, stage.height - cell - margin)

  return Array.from({ length: PIECE_COUNT }, (_, id) => ({
    id,
    row: Math.floor(id / GRID_SIZE),
    column: id % GRID_SIZE,
    groupId: id,
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY),
    z: id + 1,
  }))
}

export function pieceTransform(piece, metrics) {
  return `translate3d(${piece.x - metrics.margin}px, ${piece.y - metrics.margin}px, 0)`
}

export function findJoin(draggedIds, pieces, cell) {
  const draggedSet = new Set(draggedIds)
  const threshold = Math.max(18, cell * .24)
  let best = null

  for (const dragged of pieces.filter((piece) => draggedSet.has(piece.id))) {
    for (const stationary of pieces.filter((piece) => !draggedSet.has(piece.id))) {
      const rowDistance = dragged.row - stationary.row
      const columnDistance = dragged.column - stationary.column
      if (Math.abs(rowDistance) + Math.abs(columnDistance) !== 1) continue

      const targetX = stationary.x + columnDistance * cell
      const targetY = stationary.y + rowDistance * cell
      const dx = targetX - dragged.x
      const dy = targetY - dragged.y
      const distance = Math.hypot(dx, dy)

      if (distance <= threshold && (!best || distance < best.distance)) {
        best = { dx, dy, distance, targetGroupId: stationary.groupId }
      }
    }
  }

  return best
}

function clampGroup(group, stage, metrics) {
  const minX = Math.min(...group.map((piece) => piece.x)) - metrics.margin
  const minY = Math.min(...group.map((piece) => piece.y)) - metrics.margin
  const maxX = Math.max(...group.map((piece) => piece.x)) + metrics.cell + metrics.margin
  const maxY = Math.max(...group.map((piece) => piece.y)) + metrics.cell + metrics.margin
  let dx = 0
  let dy = 0
  if (minX < 0) dx = -minX
  else if (maxX > stage.width) dx = stage.width - maxX
  if (minY < 0) dy = -minY
  else if (maxY > stage.height) dy = stage.height - maxY
  return group.map((piece) => ({ ...piece, x: piece.x + dx, y: piece.y + dy }))
}

export function scaleGroups(pieces, previousStage, nextStage) {
  if (!previousStage.width || !previousStage.height) return scatterPieces(nextStage)
  const previousMetrics = puzzleMetrics(previousStage)
  const nextMetrics = puzzleMetrics(nextStage)
  const groups = new Map()
  pieces.forEach((piece) => {
    if (!groups.has(piece.groupId)) groups.set(piece.groupId, [])
    groups.get(piece.groupId).push(piece)
  })

  return Array.from(groups.values()).flatMap((group) => {
    const anchor = group[0]
    const anchorX = anchor.x / previousStage.width * nextStage.width
    const anchorY = anchor.y / previousStage.height * nextStage.height
    const scaled = group.map((piece) => ({
      ...piece,
      x: anchorX + (piece.column - anchor.column) * nextMetrics.cell,
      y: anchorY + (piece.row - anchor.row) * nextMetrics.cell,
    }))
    return clampGroup(scaled, nextStage, nextMetrics)
  })
}

export function rubberband(value, min, max, dimension) {
  if (value < min) {
    const overshoot = min - value
    return min - (overshoot * dimension * .55) / (dimension + .55 * overshoot)
  }
  if (value > max) {
    const overshoot = value - max
    return max + (overshoot * dimension * .55) / (dimension + .55 * overshoot)
  }
  return value
}
