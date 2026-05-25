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
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT))
      return { ...JSON.parse(JSON.stringify(DEFAULT)), ...JSON.parse(raw) }
    } catch { return JSON.parse(JSON.stringify(DEFAULT)) }
  },
  save(data: SaveData) {
    try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* */ }
  },
  reset() {
    try { localStorage.removeItem(KEY) } catch { /* */ }
  },
}
