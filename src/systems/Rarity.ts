export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type EnemyTier = 'regular' | 'elite' | 'miniboss' | 'boss'

export const RARITY_TINT: Record<Rarity, number> = {
  common:    0xaaaaaa,
  uncommon:  0x44cc44,
  rare:      0x4488ff,
  epic:      0xaa44ff,
  legendary: 0xff9900,
}

export const RARITY_COLOR: Record<Rarity, string> = {
  common:    '#aaaaaa',
  uncommon:  '#44cc44',
  rare:      '#4488ff',
  epic:      '#aa44ff',
  legendary: '#ff9900',
}

const RARITY_DMG_MULT: Record<Rarity, number> = {
  common: 1, uncommon: 1.15, rare: 1.3, epic: 1.5, legendary: 2.0,
}
const RARITY_ARMOR_MULT: Record<Rarity, number> = {
  common: 1, uncommon: 1.15, rare: 1.35, epic: 1.6, legendary: 2.0,
}

export function rarityDamageMult(r: Rarity): number { return RARITY_DMG_MULT[r] }
export function rarityArmorMult(r: Rarity): number  { return RARITY_ARMOR_MULT[r] }

export function rollRarity(tier: EnemyTier, dropChance: number): Rarity | null {
  if (Math.random() > dropChance) return null
  const r = Math.random() * 100
  if (tier === 'boss') {
    if (r < 10) return 'legendary'
    if (r < 30) return 'epic'
    if (r < 65) return 'rare'
    if (r < 90) return 'uncommon'
    return 'common'
  }
  if (tier === 'miniboss' || tier === 'elite') {
    if (r < 2)  return 'epic'
    if (r < 20) return 'rare'
    if (r < 50) return 'uncommon'
    return 'common'
  }
  if (r < 1)  return 'epic'
  if (r < 11) return 'rare'
  if (r < 31) return 'uncommon'
  return 'common'
}
