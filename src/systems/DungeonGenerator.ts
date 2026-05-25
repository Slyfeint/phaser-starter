export const TILE_WALL = 1
export const TILE_FLOOR = 2
export const TILE_STAIRS = 3

export interface Room {
  x: number; y: number; w: number; h: number
  cx: number; cy: number
}

export interface HazardSpawn {
  x: number; y: number; type: 'fire_pit' | 'spike_trap' | 'dart_turret'
}

export interface DoorPosition {
  x: number; y: number
}

export interface DungeonData {
  tiles: number[][]
  rooms: Room[]
  cols: number
  rows: number
  bossRoomIdx: number
  stairsRoomIdx: number
  shopRoomIdx: number
  minibossRoomIdx: number
  hazards: HazardSpawn[]
  doors: DoorPosition[]
}

function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function buildTunnel(tiles: number[][], r1: Room, r2: Room, doors: DoorPosition[]) {
  const mnx = Math.min(r1.cx, r2.cx), mxx = Math.max(r1.cx, r2.cx)
  for (let tx = mnx; tx <= mxx; tx++) tiles[r1.cy][tx] = TILE_FLOOR
  const mny = Math.min(r1.cy, r2.cy), mxy = Math.max(r1.cy, r2.cy)
  for (let ty = mny; ty <= mxy; ty++) tiles[ty][r2.cx] = TILE_FLOOR
  // Place door at corridor elbow
  doors.push({ x: r2.cx, y: r1.cy })
}

export function generateDungeon(
  cols: number, rows: number,
  floor = 1, isBossFloor = false,
  _depth = 0
): DungeonData {
  const tiles = Array.from({ length: rows }, () => new Array<number>(cols).fill(TILE_WALL))
  const rooms: Room[] = []
  const doors: DoorPosition[] = []

  const maxRooms = isBossFloor ? 8 : 10
  const minRooms = 5

  for (let attempt = 0; attempt < 150 && rooms.length < maxRooms; attempt++) {
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

    if (rooms.length > 0) buildTunnel(tiles, rooms[rooms.length - 1], { x, y, w, h, cx, cy }, doors)
    rooms.push({ x, y, w, h, cx, cy })
  }

  if (rooms.length < minRooms && _depth < 12)
    return generateDungeon(cols, rows, floor, isBossFloor, _depth + 1)


  const bossRoomIdx = rooms.length - 1
  const stairsRoomIdx = rooms.length >= 3 ? rooms.length - 2 : 0

  // Shop room: random mid-dungeon room (not start, not boss, not stairs)
  const midRooms = rooms.slice(1, rooms.length - 2)
  const shopRoomIdx = midRooms.length > 0
    ? 1 + Math.floor(Math.random() * midRooms.length)
    : 0

  // Miniboss room: different mid room from shop
  let minibossRoomIdx = -1
  if (!isBossFloor && midRooms.length > 1) {
    const candidates = []
    for (let i = 1; i < rooms.length - 2; i++) {
      if (i !== shopRoomIdx) candidates.push(i)
    }
    if (candidates.length > 0) {
      minibossRoomIdx = candidates[Math.floor(Math.random() * candidates.length)]
    }
  }

  // Place stairs tile in stairs room
  const sr = rooms[stairsRoomIdx]
  tiles[sr.cy][sr.cx] = TILE_STAIRS

  // Hazards: placed on floor tiles in non-special rooms
  const hazards: HazardSpawn[] = []
  const specialRooms = new Set([0, bossRoomIdx, stairsRoomIdx, shopRoomIdx, minibossRoomIdx])
  const hazardTypes: HazardSpawn['type'][] = ['fire_pit', 'spike_trap', 'dart_turret']

  const hazardCount = 3 + floor * 2
  const candidates: [number, number][] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (tiles[row][col] !== TILE_FLOOR) continue
      const inSpecial = rooms.some((r, idx) =>
        specialRooms.has(idx) &&
        col >= r.x && col < r.x + r.w &&
        row >= r.y && row < r.y + r.h
      )
      if (!inSpecial) candidates.push([col, row])
    }
  }

  const shuffled = candidates.sort(() => Math.random() - 0.5)
  for (let i = 0; i < Math.min(hazardCount, shuffled.length); i++) {
    const [col, row] = shuffled[i]
    hazards.push({ x: col, y: row, type: hazardTypes[i % hazardTypes.length] })
  }

  return { tiles, rooms, cols, rows, bossRoomIdx, stairsRoomIdx, shopRoomIdx, minibossRoomIdx, hazards, doors }
}
