export type SpawnableType = 'skeleton' | 'orc' | 'bat' | 'spider' | 'guard' | 'knight' | 'dark_mage' | 'cave_troll' | 'berserker' | 'golem' | 'wraith'
export type DungeonTheme = 'dungeon' | 'castle' | 'caves'

// Floor 1: basics only. Floor 2: introduce elites. Floor 3+: heavy elite weighting.
// Floor 4-5: progressively harder elite focus.
const FLOOR_WEIGHTS: Record<DungeonTheme, Record<number, Record<SpawnableType, number>>> = {
  dungeon: {
    1: { skeleton:55, orc:30, bat:10, spider:0,  guard:0,  knight:0,  dark_mage:0,  cave_troll:0, berserker:0, golem:0, wraith:5  },
    2: { skeleton:25, orc:25, bat:7,  spider:10, guard:10, knight:8,  dark_mage:4,  cave_troll:0, berserker:5, golem:0, wraith:6  },
    3: { skeleton:8,  orc:15, bat:4,  spider:6,  guard:10, knight:20, dark_mage:12, cave_troll:4, berserker:8, golem:3, wraith:10 },
    4: { skeleton:3,  orc:5,  bat:2,  spider:4,  guard:5,  knight:30, dark_mage:16, cave_troll:6, berserker:14,golem:8, wraith:7  },
    5: { skeleton:2,  orc:3,  bat:1,  spider:2,  guard:3,  knight:32, dark_mage:18, cave_troll:8, berserker:16,golem:10,wraith:5  },
  },
  castle: {
    1: { skeleton:15, orc:15, bat:5,  spider:0,  guard:45, knight:10, dark_mage:0,  cave_troll:0, berserker:10,golem:0, wraith:0  },
    2: { skeleton:8,  orc:12, bat:4,  spider:4,  guard:28, knight:24, dark_mage:8,  cave_troll:2, berserker:8, golem:0, wraith:2  },
    3: { skeleton:3,  orc:6,  bat:2,  spider:4,  guard:14, knight:38, dark_mage:16, cave_troll:5, berserker:10,golem:2, wraith:0  },
    4: { skeleton:1,  orc:3,  bat:1,  spider:2,  guard:6,  knight:44, dark_mage:20, cave_troll:7, berserker:12,golem:4, wraith:0  },
    5: { skeleton:1,  orc:2,  bat:1,  spider:1,  guard:4,  knight:46, dark_mage:22, cave_troll:8, berserker:12,golem:3, wraith:0  },
  },
  caves: {
    1: { skeleton:10, orc:5,  bat:45, spider:35, guard:0,  knight:0,  dark_mage:0,  cave_troll:0, berserker:0, golem:5, wraith:0  },
    2: { skeleton:5,  orc:5,  bat:30, spider:28, guard:4,  knight:4,  dark_mage:7,  cave_troll:7, berserker:0, golem:8, wraith:2  },
    3: { skeleton:2,  orc:2,  bat:16, spider:16, guard:4,  knight:8,  dark_mage:16, cave_troll:16,berserker:0, golem:14,wraith:6  },
    4: { skeleton:1,  orc:1,  bat:8,  spider:8,  guard:2,  knight:12, dark_mage:20, cave_troll:22,berserker:2, golem:20,wraith:4  },
    5: { skeleton:1,  orc:1,  bat:5,  spider:5,  guard:1,  knight:10, dark_mage:22, cave_troll:26,berserker:3, golem:22,wraith:4  },
  },
}

export function pickSpawnType(theme: DungeonTheme, floor: number): SpawnableType {
  const clampedFloor = Math.max(1, Math.min(5, floor)) as 1 | 2 | 3 | 4 | 5
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
  if (floor === 1) return 2 + Math.floor(Math.random() * 2)
  if (floor === 2) return 3 + Math.floor(Math.random() * 2)
  if (floor === 3) return 2 + Math.floor(Math.random() * 2)  // floor 3 no longer boss floor
  if (floor === 4) return 3 + Math.floor(Math.random() * 2)
  // floor 5 boss floor — fewer regular enemies
  return 2 + Math.floor(Math.random() * 2)
}
