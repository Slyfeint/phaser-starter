export type SpawnableType = 'skeleton' | 'orc' | 'bat' | 'spider' | 'guard' | 'knight' | 'dark_mage' | 'cave_troll'
export type DungeonTheme = 'dungeon' | 'castle' | 'caves'

// Floor 1: basics only. Floor 2: introduce elites. Floor 3: heavy elite weighting.
const FLOOR_WEIGHTS: Record<DungeonTheme, Record<number, Record<SpawnableType, number>>> = {
  dungeon: {
    1: { skeleton:55, orc:35, bat:10, spider:0,  guard:0,  knight:0,  dark_mage:0,  cave_troll:0 },
    2: { skeleton:30, orc:30, bat:8,  spider:10, guard:10, knight:8,  dark_mage:4,  cave_troll:0 },
    3: { skeleton:10, orc:20, bat:5,  spider:8,  guard:12, knight:25, dark_mage:15, cave_troll:5 },
  },
  castle: {
    1: { skeleton:15, orc:20, bat:5,  spider:0,  guard:50, knight:10, dark_mage:0,  cave_troll:0 },
    2: { skeleton:8,  orc:15, bat:5,  spider:5,  guard:30, knight:25, dark_mage:10, cave_troll:2 },
    3: { skeleton:3,  orc:8,  bat:3,  spider:5,  guard:15, knight:40, dark_mage:20, cave_troll:6 },
  },
  caves: {
    1: { skeleton:10, orc:5,  bat:50, spider:35, guard:0,  knight:0,  dark_mage:0,  cave_troll:0 },
    2: { skeleton:5,  orc:5,  bat:35, spider:30, guard:5,  knight:5,  dark_mage:8,  cave_troll:7 },
    3: { skeleton:3,  orc:3,  bat:20, spider:20, guard:5,  knight:10, dark_mage:20, cave_troll:19},
  },
}

export function pickSpawnType(theme: DungeonTheme, floor: number): SpawnableType {
  const clampedFloor = Math.max(1, Math.min(3, floor)) as 1 | 2 | 3
  const w = FLOOR_WEIGHTS[theme][clampedFloor]
  const total = Object.values(w).reduce((s, v) => s + v, 0)
  let r = Math.random() * total
  for (const [type, weight] of Object.entries(w) as Array<[SpawnableType, number]>) {
    r -= weight
    if (r <= 0) return type
  }
  return 'skeleton'
}

export function spawnCountForRoom(floor: number): number {
  const base = floor === 1 ? 2 : floor === 2 ? 3 : 2  // floor 3 has boss, fewer regular
  return base + Math.floor(Math.random() * 2)
}
