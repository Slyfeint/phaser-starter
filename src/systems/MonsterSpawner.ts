export type SpawnableType = 'skeleton' | 'orc' | 'bat' | 'spider' | 'guard' | 'knight' | 'dark_mage' | 'cave_troll'
export type DungeonTheme = 'dungeon' | 'castle' | 'caves'

const WEIGHTS: Record<DungeonTheme, Record<SpawnableType, number>> = {
  dungeon: { skeleton:40, orc:30, bat:8,  spider:8,  guard:8,  knight:4,  dark_mage:2,  cave_troll:0 },
  castle:  { skeleton:10, orc:15, bat:5,  spider:5,  guard:30, knight:25, dark_mage:8,  cave_troll:2 },
  caves:   { skeleton:8,  orc:4,  bat:35, spider:30, guard:5,  knight:4,  dark_mage:10, cave_troll:4 },
}

export function pickSpawnType(theme: DungeonTheme, _floor: number): SpawnableType {
  const w = WEIGHTS[theme]
  // floor 2-3: reduce weakest, boost strongest
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
