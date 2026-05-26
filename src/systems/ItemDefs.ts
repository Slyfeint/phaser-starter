import type { WeaponType } from './WeaponDefs'
import type { Rarity } from './Rarity'
import { rarityDamageMult, rarityArmorMult } from './Rarity'
import { WEAPONS } from './WeaponDefs'
import type { WeaponDef } from './WeaponDefs'

export type SlotType = 'weapon' | 'helm' | 'chest' | 'legs' | 'gloves' | 'ring' | 'necklace' | 'consumable'
export type EquipSlot = 'weapon1' | 'weapon2' | 'helm' | 'chest' | 'legs' | 'gloves' | 'ring' | 'necklace'

export interface ItemDef {
  id: string
  name: string
  slotType: SlotType
  bagSize: 1 | 2 | 3
  weaponType?: WeaponType
  rarity: Rarity
  bonusMaxHp?: number
  bonusArmor?: number
  bonusSpeed?: number
  bonusAtkSpeed?: number
  bonusCrit?: number
  bonusLootMult?: number
  healAmount?: number
  speedBoostAmt?: number
  speedBoostMs?: number
  shieldAmount?: number
}

function w(id: string, name: string, wt: WeaponType, r: Rarity): ItemDef {
  const sz: Record<WeaponType, 1|2|3> = { dagger: 1, sword: 2, mace: 2, spear: 3 }
  return { id, name, slotType: 'weapon', bagSize: sz[wt], weaponType: wt, rarity: r }
}

function armor(id: string, name: string, slot: Exclude<SlotType,'weapon'|'consumable'>, r: Rarity,
  hp=0, armor=0, spd=0, atkSpd=0, crit=0, lootM=0): ItemDef {
  const sz: Record<string, 1|2|3> = {helm:2,chest:2,legs:2,gloves:1,ring:1,necklace:1}
  const mult = rarityArmorMult(r)
  return {
    id, name, slotType: slot, bagSize: sz[slot] as 1|2|3, rarity: r,
    bonusMaxHp:    hp    ? Math.round(hp    * mult) : undefined,
    bonusArmor:    armor ? Math.round(armor * mult) : undefined,
    bonusSpeed:    spd   ? Math.round(spd   * mult) : undefined,
    bonusAtkSpeed: atkSpd || undefined,
    bonusCrit:     crit  || undefined,
    bonusLootMult: lootM || undefined,
  }
}

export const ITEMS: ItemDef[] = [
  // ── Swords ──
  w('iron_sword',    'Iron Sword',       'sword',  'common'),
  w('steel_sword',   'Steel Sword',      'sword',  'uncommon'),
  w('enchanted_blade','Enchanted Blade', 'sword',  'rare'),
  w('vorpal_sword',  'Vorpal Sword',     'sword',  'epic'),
  w('soul_reaper',   'Soul Reaper',      'sword',  'legendary'),
  // ── Spears ──
  w('wood_spear',    'Wooden Spear',     'spear',  'common'),
  w('steel_spear',   'Steel Spear',      'spear',  'uncommon'),
  w('long_spear',    'Long Spear',       'spear',  'rare'),
  w('void_spear',    'Void Spear',       'spear',  'epic'),
  w('world_spear',   'World-Ender Spear','spear',  'legendary'),
  // ── Maces ──
  w('iron_mace',     'Iron Mace',        'mace',   'common'),
  w('war_mace',      'War Mace',         'mace',   'rare'),
  w('holy_mace',     'Holy Mace',        'mace',   'epic'),
  w('god_mace',      'God Mace',         'mace',   'legendary'),
  // ── Daggers ──
  w('quick_dagger',  'Quick Dagger',     'dagger', 'common'),
  w('shadow_dagger', 'Shadow Dagger',    'dagger', 'uncommon'),
  w('assassin_dagger','Assassin Dagger', 'dagger', 'rare'),
  w('death_dagger',  "Death's Dagger",   'dagger', 'epic'),
  w('void_dagger',   'Void Dagger',      'dagger', 'legendary'),
  // ── Helms ──
  armor('iron_helm',      'Iron Helm',        'helm',     'common',   30),
  armor('steel_helm',     'Steel Helm',       'helm',     'uncommon', 40),
  armor('great_helm',     'Great Helm',       'helm',     'rare',     50),
  armor('enchanted_helm', 'Enchanted Helm',   'helm',     'epic',     60, 0, 0, 0, 0.05),
  armor('legendary_helm', 'Crown of Kings',   'helm',     'legendary',80, 10),
  // ── Chest ──
  armor('chain_chest',  'Chain Chest',        'chest',    'common',   0, 10),
  armor('plate_chest',  'Plate Chest',        'chest',    'rare',     0, 15),
  armor('epic_chest',   'Enchanted Plate',    'chest',    'epic',     0, 20),
  armor('legend_chest', 'Eternal Breastplate','chest',    'legendary',50,25),
  // ── Legs ──
  armor('swift_greaves', 'Swift Greaves',     'legs',     'common',   0,0,25),
  armor('wind_greaves',  'Wind Greaves',       'legs',     'rare',     0,0,40),
  armor('epic_greaves',  'Spectral Greaves',  'legs',     'epic',     0,0,60),
  armor('legend_legs',   'Boots of Hermes',   'legs',     'legendary',0,0,80),
  // ── Gloves ──
  armor('fighter_gloves',  'Fighter Gloves',  'gloves',   'common',   0,0,0,0.80),
  armor('swift_gloves',    'Swift Gloves',    'gloves',   'uncommon', 0,0,0,0.75),
  armor('assassin_gloves', 'Assassin Gloves', 'gloves',   'rare',     0,0,0,0.65,0.05),
  armor('legend_gloves',   'God Hands',       'gloves',   'legendary',0,0,0,0.50,0.10),
  // ── Rings ──
  armor('gold_ring',      'Gold Ring',        'ring',     'common',   0,0,0,0,0.08),
  armor('swift_ring',     'Ring of Swiftness','ring',     'uncommon', 0,0,25),
  armor('titan_ring',     'Titan Ring',       'ring',     'uncommon', 30),
  armor('assassin_ring',  "Assassin's Ring",  'ring',     'rare',     0,0,0,0,0.15),
  armor('epic_ring',      'Ring of Fortune',  'ring',     'epic',     0,0,0,0,0.20),
  armor('legend_ring',    'Omniring',         'ring',     'legendary',0,5,0,0,0.30),
  // ── Necklaces ──
  armor('necklace_warding','Necklace of Warding','necklace','uncommon',0,8),
  armor('power_amulet',   'Amulet of Power',  'necklace', 'rare',     0,0,0,0.80,0.05),
  armor('greed_necklace', 'Necklace of Greed','necklace', 'rare',     0,0,0,0,0,1.5),
  armor('epic_necklace',  'Amulet of Avarice','necklace', 'epic',     0,0,0,0,0,2.0),
  armor('legend_neck',    "Midas' Chain",     'necklace', 'legendary',0,0,0,0,0.10,3.0),
  // ── Consumables ──
  { id:'bandage',        name:'Bandage',        slotType:'consumable', bagSize:1, rarity:'common',    healAmount:40  },
  { id:'greater_bandage',name:'Greater Bandage',slotType:'consumable', bagSize:1, rarity:'uncommon',  healAmount:100 },
  { id:'elixir',         name:'Elixir',         slotType:'consumable', bagSize:1, rarity:'rare',      healAmount:200 },
  { id:'speed_potion',   name:'Speed Potion',   slotType:'consumable', bagSize:1, rarity:'uncommon',  speedBoostAmt:120, speedBoostMs:8000 },
  { id:'shield_flask',   name:'Shield Flask',   slotType:'consumable', bagSize:1, rarity:'rare',      shieldAmount:60 },
]

export const WEAPON_ITEMS = ITEMS.filter(i => i.slotType === 'weapon')
export const ARMOR_ITEMS  = ITEMS.filter(i => i.slotType !== 'weapon' && i.slotType !== 'consumable')

export function getScaledWeapon(item: ItemDef): WeaponDef | null {
  if (!item.weaponType) return null
  const base = WEAPONS[item.weaponType]
  const mult = rarityDamageMult(item.rarity)
  return { ...base, damage: Math.round(base.damage * mult) }
}

export function itemsByRarity(rarity: Rarity): ItemDef[] {
  return ITEMS.filter(i => i.rarity === rarity && i.slotType !== 'consumable')
}
