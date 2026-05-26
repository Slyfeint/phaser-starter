import type { EquipSlot, ItemDef } from './ItemDefs'
import { QUESTS } from './QuestDefs'

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
  difficulty: 'easy' | 'normal' | 'hard'
  skills: string[]
  metaUpgrades: Record<string, number>
  quests: {
    active: string[]
    progress: Record<string, number>
    completed: string[]
  }
  killStats: {
    byWeapon: Record<string, number>
    byEnemy: Record<string, number>
    totalKills: number
    floorsCleared: number
    runsCompleted: number
  }
  achievements: {
    progress: Record<string, number>
    completed: string[]
  }
  selectedClass: 'rogue' | 'ranger' | 'mage' | null
  classSkills: string[]
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
  difficulty: 'normal' as const,
  skills: [] as string[],
  metaUpgrades: {} as Record<string, number>,
  quests: {
    active: QUESTS.slice(0, 3).map(q => q.id),
    progress: {} as Record<string, number>,
    completed: [] as string[],
  },
  killStats: {
    byWeapon: {} as Record<string, number>,
    byEnemy: {} as Record<string, number>,
    totalKills: 0,
    floorsCleared: 0,
    runsCompleted: 0,
  },
  achievements: {
    progress: {} as Record<string, number>,
    completed: [] as string[],
  },
  selectedClass: null as 'rogue' | 'ranger' | 'mage' | null,
  classSkills: [] as string[],
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
        quests: {
          active:    (p.quests?.active    ?? d.quests.active),
          progress:  { ...d.quests.progress,  ...(p.quests?.progress  ?? {}) },
          completed: p.quests?.completed ?? d.quests.completed,
        },
        killStats: { ...d.killStats, ...(p.killStats ?? {}) },
        achievements: {
          progress:  { ...d.achievements.progress,  ...(p.achievements?.progress  ?? {}) },
          completed: p.achievements?.completed ?? d.achievements.completed,
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
