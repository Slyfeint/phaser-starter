export interface CosmeticBonus {
  maxHp?: number
  armor?: number
  speed?: number
  critChance?: number
  lootMult?: number
  atkSpeedMult?: number
  damageMult?: number
}

export interface CosmeticDef {
  id: string
  name: string
  tint: number
  price: number
  fromBoss: boolean
  bonus: CosmeticBonus
  bonusLabel: string
  // Stat bonuses are for earned cosmetics only.
  // Future paid cosmetics: visual tint only, bonusLabel: 'Visual Only', no stat fields.
  earnedBonus: boolean
}

export const COSMETICS: CosmeticDef[] = [
  { id: 'steel',   name: 'Steel',   tint: 0xffffff, price: 0,    fromBoss: false, bonus: {},                    bonusLabel: 'Balanced',    earnedBonus: true },
  { id: 'crimson', name: 'Crimson', tint: 0xff5555, price: 500,  fromBoss: false, bonus: { critChance: 0.08 },  bonusLabel: '+8% crit',    earnedBonus: true },
  { id: 'forest',  name: 'Forest',  tint: 0x44cc44, price: 500,  fromBoss: false, bonus: { maxHp: 20 },         bonusLabel: '+20 HP',      earnedBonus: true },
  { id: 'ocean',   name: 'Ocean',   tint: 0x4488ff, price: 750,  fromBoss: false, bonus: { armor: 8 },          bonusLabel: '+8% armor',   earnedBonus: true },
  { id: 'shadow',  name: 'Shadow',  tint: 0x9944bb, price: 1000, fromBoss: false, bonus: { speed: 20 },         bonusLabel: '+20 spd',     earnedBonus: true },
  { id: 'gold',    name: 'Gold',    tint: 0xffcc00, price: 1500, fromBoss: false, bonus: { lootMult: 1.25 },    bonusLabel: '+25% loot',   earnedBonus: true },
  { id: 'void',    name: 'Void',    tint: 0x220066, price: 0,    fromBoss: true,  bonus: { atkSpeedMult: 0.85 },bonusLabel: '-15% atk cd', earnedBonus: true },
  { id: 'blood',   name: 'Blood',   tint: 0x880011, price: 0,    fromBoss: true,  bonus: { damageMult: 1.15 },  bonusLabel: '+15% dmg',    earnedBonus: true },
]

// Future paid cosmetics: visual tint only, no stat bonuses.
// Add entries here when real-money IAP is implemented.
export const PAID_COSMETICS: CosmeticDef[] = []
