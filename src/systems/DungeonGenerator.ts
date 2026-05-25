export const TILE_WALL = 1
export const TILE_FLOOR = 2

export interface Room {
  x: number; y: number; w: number; h: number
  cx: number; cy: number
}

export interface DungeonData {
  tiles: number[][]
  rooms: Room[]
  cols: number
  rows: number
}

function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateDungeon(cols: number, rows: number): DungeonData {
  const tiles = Array.from({ length: rows }, () => new Array<number>(cols).fill(TILE_WALL))
  const rooms: Room[] = []

  for (let attempt = 0; attempt < 100 && rooms.length < 10; attempt++) {
    const w = ri(5, 12), h = ri(4, 9)
    const x = ri(2, cols - w - 2), y = ri(2, rows - h - 2)

    const overlaps = rooms.some(r =>
      x <= r.x + r.w + 1 && x + w + 1 >= r.x &&
      y <= r.y + r.h + 1 && y + h + 1 >= r.y
    )
    if (overlaps) continue

    for (let ry = y; ry < y + h; ry++)
      for (let rx = x; rx < x + w; rx++)
        tiles[ry][rx] = TILE_FLOOR

    const cx = Math.floor(x + w / 2)
    const cy = Math.floor(y + h / 2)

    if (rooms.length > 0) {
      const prev = rooms[rooms.length - 1]
      // Horizontal leg then vertical leg
      const mnx = Math.min(prev.cx, cx), mxx = Math.max(prev.cx, cx)
      for (let tx = mnx; tx <= mxx; tx++) tiles[prev.cy][tx] = TILE_FLOOR
      const mny = Math.min(prev.cy, cy), mxy = Math.max(prev.cy, cy)
      for (let ty = mny; ty <= mxy; ty++) tiles[ty][cx] = TILE_FLOOR
    }

    rooms.push({ x, y, w, h, cx, cy })
  }

  // Retry if too few rooms were carved
  if (rooms.length < 4) return generateDungeon(cols, rows)

  return { tiles, rooms, cols, rows }
}
