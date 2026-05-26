import type { EquipSlot, ItemDef } from './ItemDefs'

export interface DungeonProgress {
  highestFloor: number
  bossDefeated: boolean
}

export interface SaveData {
  gold: number
  equippedGear: Partial<Record<EquipSlot, ItemDef>>
  bag: ItemDef[]
  unlockedCosmetics: string[]
  activeCosmetic: string
  progress: Record<'dungeon' | 'castle' | 'caves', DungeonProgress>
  stats: { totalKills: number; totalGold: number; runsCompleted: number }
}

const DEFAULT: SaveData = {
  gold: 0,
  equippedGear: {},
  bag: [],
  unlockedCosmetics: ['steel'],
  activeCosmetic: 'steel',
  progress: {
    dungeon: { highestFloor: 0, bossDefeated: false },
    castle:  { highestFloor: 0, bossDefeated: false },
    caves:   { highestFloor: 0, bossDefeated: false },
  },
  stats: { totalKills: 0, totalGold: 0, runsCompleted: 0 },
}

const KEY = 'dd_save_v1'

export const SaveManager = {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return structuredClone(DEFAULT)
      const d = structuredClone(DEFAULT)
      const p = JSON.parse(raw) as Partial<SaveData>
      return {
        ...d,
        ...p,
        stats: { ...d.stats, ...(p.stats ?? {}) },
        progress: {
          dungeon: { ...d.progress.dungeon, ...(p.progress?.dungeon ?? {}) },
          castle:  { ...d.progress.castle,  ...(p.progress?.castle  ?? {}) },
          caves:   { ...d.progress.caves,   ...(p.progress?.caves   ?? {}) },
        },
      }
    } catch { return structuredClone(DEFAULT) }
  },
  save(data: SaveData) {
    try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* */ }
  },
  reset() {
    try { localStorage.removeItem(KEY) } catch { /* */ }
  },
}
