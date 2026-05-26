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
  setId?: string
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
  damageBoostPct?: number
  damageBoostMs?: number
  smokeEffect?: boolean
}

function w(id: string, name: string, wt: WeaponType, r: Rarity): ItemDef {
  const sz: Record<WeaponType, 1|2|3> = { dagger: 1, sword: 2, mace: 2, spear: 3, axe: 2, staff: 2, bow: 2, dual_dagger: 1 }
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
  // ── Set Items ──
  // Shadow set (ring+necklace) → +12% crit total, dagger bleed +2 ticks
  { id:'shadow_ring',      name:'Shadow Ring',     slotType:'ring',      bagSize:1, rarity:'rare',  bonusCrit:0.06, setId:'shadow' },
  { id:'shadow_necklace',  name:'Shadow Necklace', slotType:'necklace',  bagSize:1, rarity:'rare',  bonusCrit:0.06, setId:'shadow' },
  // Iron set (helm+chest) → reflect 8% damage on hit
  { id:'iron_set_helm',    name:'Iron Bastion',    slotType:'helm',      bagSize:2, rarity:'uncommon', bonusMaxHp:20, bonusArmor:4, setId:'iron'   },
  { id:'iron_set_chest',   name:'Iron Fortress',   slotType:'chest',     bagSize:2, rarity:'uncommon', bonusMaxHp:20, bonusArmor:4, setId:'iron'   },
  // Wind set (greaves+gloves) → roll CD −200ms (bonus on top of items' speed)
  { id:'wind_set_greaves', name:'Wind Treads',     slotType:'legs',      bagSize:2, rarity:'uncommon', bonusSpeed:18, setId:'wind'  },
  { id:'wind_set_gloves',  name:'Wind Grips',      slotType:'gloves',    bagSize:1, rarity:'uncommon', bonusSpeed:18, bonusAtkSpeed:0.90, setId:'wind' },
  // ── Axes ──
  w('iron_axe',   'Iron Axe',    'axe', 'common'),
  w('war_axe',    'War Axe',     'axe', 'uncommon'),
  w('great_axe',  'Great Axe',   'axe', 'rare'),
  w('doom_axe',   'Doom Axe',    'axe', 'epic'),
  // ── Staves ──
  w('oak_staff',    'Oak Staff',    'staff', 'common'),
  w('arcane_staff', 'Arcane Staff', 'staff', 'uncommon'),
  w('storm_staff',  'Storm Staff',  'staff', 'rare'),
  w('void_staff',   'Void Staff',   'staff', 'epic'),
  // ── Consumables ──
  { id:'bandage',        name:'Bandage',        slotType:'consumable', bagSize:1, rarity:'common',    healAmount:40  },
  { id:'greater_bandage',name:'Greater Bandage',slotType:'consumable', bagSize:1, rarity:'uncommon',  healAmount:100 },
  { id:'elixir',         name:'Elixir',         slotType:'consumable', bagSize:1, rarity:'rare',      healAmount:200 },
  { id:'speed_potion',   name:'Speed Potion',   slotType:'consumable', bagSize:1, rarity:'uncommon',  speedBoostAmt:120, speedBoostMs:8000 },
  { id:'shield_flask',   name:'Shield Flask',   slotType:'consumable', bagSize:1, rarity:'rare',      shieldAmount:60 },
  { id:'whetstone',      name:'Whetstone',      slotType:'consumable', bagSize:1, rarity:'uncommon',  damageBoostPct:0.30, damageBoostMs:10000 },
  { id:'smoke_bomb',     name:'Smoke Bomb',     slotType:'consumable', bagSize:1, rarity:'uncommon',  speedBoostAmt:60, speedBoostMs:3000, smokeEffect:true },
  // ── Bow weapons ──
  w('wood_bow',    'Wood Bow',        'bow', 'common'),
  w('hunter_bow',  'Hunter Bow',      'bow', 'uncommon'),
  w('elven_bow',   'Elven Bow',       'bow', 'rare'),
  w('war_bow',     'War Bow',         'bow', 'epic'),
  w('storm_bow',   'Storm Bow',       'bow', 'legendary'),
  // ── Dual Daggers ──
  w('twin_knives',  'Twin Knives',    'dual_dagger', 'common'),
  w('twin_daggers', 'Twin Daggers',   'dual_dagger', 'uncommon'),
  w('twin_blades',  'Twin Blades',    'dual_dagger', 'rare'),
  w('shadow_twins', 'Shadow Twins',   'dual_dagger', 'epic'),
  w('void_fangs',   'Void Fangs',     'dual_dagger', 'legendary'),
  // ── Rogue Gear ──
  { id:'rogue_mask',      name:"Rogue's Mask",        slotType:'helm',     bagSize:2, rarity:'uncommon', bonusCrit:0.10, bonusArmor:8 },
  { id:'shadow_leather',  name:'Shadow Leather',       slotType:'chest',    bagSize:2, rarity:'uncommon', bonusSpeed:15,  bonusCrit:0.05 },
  { id:'swift_boots',     name:'Swift Boots',          slotType:'legs',     bagSize:2, rarity:'common',   bonusSpeed:30 },
  { id:'thief_gloves',    name:"Thief's Gloves",       slotType:'gloves',   bagSize:1, rarity:'uncommon', bonusAtkSpeed:0.78, bonusCrit:0.05 },
  { id:'shadowstep_ring', name:'Shadowstep Ring',      slotType:'ring',     bagSize:1, rarity:'rare',     bonusCrit:0.12, bonusSpeed:15 },
  { id:'rogue_cloak',     name:'Rogue Cloak',          slotType:'necklace', bagSize:1, rarity:'rare',     bonusCrit:0.08, bonusArmor:5 },
  // ── Ranger Gear ──
  { id:'ranger_hood',     name:'Ranger Hood',          slotType:'helm',     bagSize:2, rarity:'uncommon', bonusMaxHp:20,  bonusCrit:0.05 },
  { id:'ranger_cloak',    name:'Ranger Cloak',         slotType:'chest',    bagSize:2, rarity:'uncommon', bonusSpeed:20,  bonusArmor:8 },
  { id:'tracking_boots',  name:'Tracking Boots',       slotType:'legs',     bagSize:2, rarity:'common',   bonusSpeed:25 },
  { id:'archer_gloves',   name:"Archer's Gloves",      slotType:'gloves',   bagSize:1, rarity:'uncommon', bonusAtkSpeed:0.75 },
  { id:'hawkeye_ring',    name:'Hawk Eye Ring',         slotType:'ring',     bagSize:1, rarity:'rare',     bonusCrit:0.10, bonusSpeed:15 },
  { id:'marksman_neck',   name:"Marksman's Pendant",   slotType:'necklace', bagSize:1, rarity:'rare',     bonusCrit:0.08, bonusLootMult:1.2 },
  // ── Mage Gear ──
  { id:'arcane_hood',     name:'Arcane Hood',          slotType:'helm',     bagSize:2, rarity:'uncommon', bonusCrit:0.12 },
  { id:'arcane_robes',    name:'Arcane Robes',         slotType:'chest',    bagSize:2, rarity:'uncommon', bonusMaxHp:20, bonusArmor:5 },
  { id:'mage_greaves',    name:'Mage Greaves',         slotType:'legs',     bagSize:2, rarity:'common',   bonusSpeed:30 },
  { id:'spellcast_gloves',name:"Spellcaster's Gloves", slotType:'gloves',   bagSize:1, rarity:'uncommon', bonusAtkSpeed:0.75 },
  { id:'arcane_ring',     name:'Arcane Ring',          slotType:'ring',     bagSize:1, rarity:'rare',     bonusCrit:0.12 },
  { id:'sorcerer_neck',   name:"Sorcerer's Necklace",  slotType:'necklace', bagSize:1, rarity:'rare',     bonusCrit:0.08, bonusLootMult:1.3 },
  { id:'arcane_tome',     name:'Arcane Tome',          slotType:'weapon',   bagSize:2, rarity:'rare',     weaponType:'staff' as WeaponType },
]

export const ALL_ITEMS    = ITEMS
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
