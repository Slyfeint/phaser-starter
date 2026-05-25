import type { WeaponType } from './WeaponDefs'

export type SlotType = 'weapon' | 'helm' | 'chest' | 'legs' | 'gloves' | 'ring' | 'necklace'
export type EquipSlot = 'weapon1' | 'weapon2' | 'helm' | 'chest' | 'legs' | 'gloves' | 'ring' | 'necklace'

export interface ItemDef {
  id: string
  name: string
  slotType: SlotType
  weaponType?: WeaponType
  bonusMaxHp?: number
  bonusArmor?: number
  bonusSpeed?: number
  bonusAtkSpeed?: number
  bonusCrit?: number
  bonusLootMult?: number
  rarity: 'common' | 'rare' | 'epic'
}

export const ITEMS: ItemDef[] = [
  { id: 'iron_sword',     name: 'Iron Sword',       slotType: 'weapon', weaponType: 'sword',  rarity: 'common' },
  { id: 'long_spear',     name: 'Long Spear',        slotType: 'weapon', weaponType: 'spear',  rarity: 'common' },
  { id: 'war_mace',       name: 'War Mace',          slotType: 'weapon', weaponType: 'mace',   rarity: 'rare'   },
  { id: 'quick_dagger',   name: 'Quick Dagger',      slotType: 'weapon', weaponType: 'dagger', rarity: 'common' },
  { id: 'iron_helm',      name: 'Iron Helm',         slotType: 'helm',   bonusMaxHp: 30,       rarity: 'common' },
  { id: 'great_helm',     name: 'Great Helm',        slotType: 'helm',   bonusMaxHp: 60,       rarity: 'rare'   },
  { id: 'chain_chest',    name: 'Chain Chest',       slotType: 'chest',  bonusArmor: 10,       rarity: 'common' },
  { id: 'plate_chest',    name: 'Plate Chest',       slotType: 'chest',  bonusArmor: 20,       rarity: 'rare'   },
  { id: 'swift_greaves',  name: 'Swift Greaves',     slotType: 'legs',   bonusSpeed: 25,       rarity: 'common' },
  { id: 'wind_greaves',   name: 'Wind Greaves',      slotType: 'legs',   bonusSpeed: 50,       rarity: 'rare'   },
  { id: 'fighter_gloves', name: 'Fighter Gloves',    slotType: 'gloves', bonusAtkSpeed: 0.8,   rarity: 'common' },
  { id: 'gold_ring',      name: 'Gold Ring',         slotType: 'ring',   bonusCrit: 0.08,      rarity: 'common' },
  { id: 'assassin_ring',  name: "Assassin's Ring",   slotType: 'ring',   bonusCrit: 0.15,      rarity: 'rare'   },
  { id: 'greed_necklace', name: 'Necklace of Greed', slotType: 'necklace', bonusLootMult: 1.5, rarity: 'rare'   },
]

export const WEAPON_ITEMS = ITEMS.filter(i => i.slotType === 'weapon')
export const ARMOR_ITEMS  = ITEMS.filter(i => i.slotType !== 'weapon')
