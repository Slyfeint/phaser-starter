export type TrackId = 'warrior' | 'sentinel' | 'scavenger' | 'rogue' | 'ranger' | 'mage'

export interface SkillNode {
  id: string
  track: TrackId
  tier: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  desc: string
  cost: number
}

export const SKILL_TREE: SkillNode[] = [
  // Warrior — offense
  { id: 'w1', track: 'warrior',   tier: 1, name: 'Iron Grip',      cost: 200,  desc: '+8% weapon damage' },
  { id: 'w2', track: 'warrior',   tier: 2, name: 'Fury Strikes',   cost: 450,  desc: '+15% damage, +5% crit' },
  { id: 'w3', track: 'warrior',   tier: 3, name: 'Exploit',        cost: 800,  desc: 'Crits apply Cripple' },
  { id: 'w4', track: 'warrior',   tier: 4, name: 'Execute',        cost: 1200, desc: 'Kills below 18% HP deal 2× dmg' },
  { id: 'w5', track: 'warrior',   tier: 5, name: 'Berserker',      cost: 1800, desc: '+20 speed for 3s on kill' },
  { id: 'w6', track: 'warrior',   tier: 6, name: 'Bloodlust',      cost: 2400, desc: 'On kill, heal 3 HP' },
  // Sentinel — defense
  { id: 's1', track: 'sentinel',  tier: 1, name: 'Fortify',        cost: 200,  desc: '+15 max HP' },
  { id: 's2', track: 'sentinel',  tier: 2, name: 'Plating',        cost: 450,  desc: '+6% armor reduction' },
  { id: 's3', track: 'sentinel',  tier: 3, name: 'Swift Roll',     cost: 800,  desc: 'Roll cooldown −250ms' },
  { id: 's4', track: 'sentinel',  tier: 4, name: 'Resilience',     cost: 1200, desc: 'Status durations −40%' },
  { id: 's5', track: 'sentinel',  tier: 5, name: 'Last Stand',     cost: 1800, desc: 'Survive one killing blow (1 HP)' },
  // Scavenger — loot/economy
  { id: 'q1', track: 'scavenger', tier: 1, name: 'Keen Eye',       cost: 200,  desc: '+15% loot multiplier' },
  { id: 'q2', track: 'scavenger', tier: 2, name: 'Bargain',        cost: 450,  desc: 'Shop prices −15%' },
  { id: 'q3', track: 'scavenger', tier: 3, name: 'Pack Rat',       cost: 800,  desc: 'Bag capacity +2 slots' },
  { id: 'q4', track: 'scavenger', tier: 4, name: 'Treasure Sense', cost: 1200, desc: '+1 gold per enemy kill' },
  { id: 'q5', track: 'scavenger', tier: 5, name: 'Fortune',        cost: 1800, desc: '+20% legendary loot chance' },
  { id: 'q6', track: 'scavenger', tier: 6, name: "Scavenger's Instinct", cost: 2400, desc: 'First item pickup per room is uncommon+' },
]

export interface SkillEffects {
  damageMult: number
  critBonus: number
  maxHpBonus: number
  armorBonus: number
  rollCdReduction: number
  statusDurMult: number
  lastStand: boolean
  lootMult: number
  shopDiscount: number
  bagBonus: number
  goldPerKill: number
  legendaryBonus: number
  berserkerOnKill: boolean
  executeBonus: boolean
  critAppliesCripple: boolean
  bloodlust: boolean
  scavengerInstinct: boolean
}

export interface ClassSkillEffects {
  // Rogue
  rogueBladeFlurry: boolean
  rogueBackstab: boolean
  roguePoisonedBlades: boolean
  rogueShadowVanish: boolean
  rogueDeathMark: boolean
  rogueKillingSpree: boolean
  // Ranger
  rangerHawkeye: boolean
  rangerRapidFire: boolean
  rangerExplosiveArrow: boolean
  rangerTrapExpert: boolean
  rangerEagleEye: boolean
  rangerPredator: boolean
  // Mage
  mageArcanePower: boolean
  mageFrostNova: boolean
  mageChainLightning: boolean
  mageManaShield: boolean
  mageOverload: boolean
  mageArcaneMastery: boolean
}

export const DEFAULT_CLASS_EFFECTS: ClassSkillEffects = {
  rogueBladeFlurry: false, rogueBackstab: false, roguePoisonedBlades: false,
  rogueShadowVanish: false, rogueDeathMark: false, rogueKillingSpree: false,
  rangerHawkeye: false, rangerRapidFire: false, rangerExplosiveArrow: false,
  rangerTrapExpert: false, rangerEagleEye: false, rangerPredator: false,
  mageArcanePower: false, mageFrostNova: false, mageChainLightning: false,
  mageManaShield: false, mageOverload: false, mageArcaneMastery: false,
}

export function computeClassSkillEffects(unlockedIds: string[]): ClassSkillEffects {
  const has = (id: string) => unlockedIds.includes(id)
  return {
    rogueBladeFlurry:    has('rogue_1'),
    rogueBackstab:       has('rogue_2'),
    roguePoisonedBlades: has('rogue_3'),
    rogueShadowVanish:   has('rogue_4'),
    rogueDeathMark:      has('rogue_5'),
    rogueKillingSpree:   has('rogue_6'),
    rangerHawkeye:       has('ranger_1'),
    rangerRapidFire:     has('ranger_2'),
    rangerExplosiveArrow:has('ranger_3'),
    rangerTrapExpert:    has('ranger_4'),
    rangerEagleEye:      has('ranger_5'),
    rangerPredator:      has('ranger_6'),
    mageArcanePower:     has('mage_1'),
    mageFrostNova:       has('mage_2'),
    mageChainLightning:  has('mage_3'),
    mageManaShield:      has('mage_4'),
    mageOverload:        has('mage_5'),
    mageArcaneMastery:   has('mage_6'),
  }
}

export const CLASS_SKILL_TREE: SkillNode[] = [
  // ROGUE (6 nodes)
  { id:'rogue_1', track:'rogue', tier:1, name:'Blade Flurry',     desc:'+15% atk speed, +5% crit',              cost:200  },
  { id:'rogue_2', track:'rogue', tier:2, name:'Backstab',          desc:'+60% dmg attacking from behind',        cost:450  },
  { id:'rogue_3', track:'rogue', tier:3, name:'Poisoned Blades',   desc:'Dagger hits apply Poison 3s',           cost:800  },
  { id:'rogue_4', track:'rogue', tier:4, name:'Shadow Vanish',     desc:'Invisible 1.5s after Shadow Step',      cost:1200 },
  { id:'rogue_5', track:'rogue', tier:5, name:'Death Mark',        desc:'+35% dmg to enemies below 25% HP',      cost:1800 },
  { id:'rogue_6', track:'rogue', tier:6, name:'Killing Spree',     desc:'Kill resets Shadow Step cooldown',      cost:2400 },
  // RANGER (6 nodes)
  { id:'ranger_1', track:'ranger', tier:1, name:'Hawkeye',         desc:'+50 bow range, +10% projectile dmg',    cost:200  },
  { id:'ranger_2', track:'ranger', tier:2, name:'Rapid Fire',      desc:'Bow cooldown -20%',                     cost:450  },
  { id:'ranger_3', track:'ranger', tier:3, name:'Explosive Arrow', desc:'Bow hits splash 60px, 50% dmg',         cost:800  },
  { id:'ranger_4', track:'ranger', tier:4, name:'Trap Expert',     desc:'Bear Trap deals 60 dmg, 2 traps max',   cost:1200 },
  { id:'ranger_5', track:'ranger', tier:5, name:'Eagle Eye',       desc:'Crit guaranteed on enemies below 40% HP', cost:1800 },
  { id:'ranger_6', track:'ranger', tier:6, name:'Predator',        desc:'Post Aimed Shot: next 3 attacks crit',  cost:2400 },
  // MAGE (6 nodes)
  { id:'mage_1', track:'mage', tier:1, name:'Arcane Power',        desc:'+12% projectile/staff damage',          cost:200  },
  { id:'mage_2', track:'mage', tier:2, name:'Frost Nova',          desc:'Staff kill: 80px slow field 3s',        cost:450  },
  { id:'mage_3', track:'mage', tier:3, name:'Chain Lightning',     desc:'Staff bolt bounces to nearest enemy',   cost:800  },
  { id:'mage_4', track:'mage', tier:4, name:'Mana Shield',         desc:'40% chance absorb hit once per 5s',     cost:1200 },
  { id:'mage_5', track:'mage', tier:5, name:'Overload',            desc:'Every 4th staff hit deals 2x damage',   cost:1800 },
  { id:'mage_6', track:'mage', tier:6, name:'Arcane Mastery',      desc:'Arcane Burst: half CD, +40% radius',   cost:2400 },
]

export function computeSkillEffects(unlockedIds: string[]): SkillEffects {
  const has = (id: string) => unlockedIds.includes(id)
  return {
    damageMult:        1 + (has('w1') ? 0.08 : 0) + (has('w2') ? 0.15 : 0),
    critBonus:         (has('w2') ? 0.05 : 0),
    maxHpBonus:        (has('s1') ? 15 : 0),
    armorBonus:        (has('s2') ? 6 : 0),
    rollCdReduction:   (has('s3') ? 250 : 0),
    statusDurMult:     has('s4') ? 0.6 : 1,
    lastStand:         has('s5'),
    lootMult:          1 + (has('q1') ? 0.15 : 0),
    shopDiscount:      has('q2') ? 0.15 : 0,
    bagBonus:          has('q3') ? 2 : 0,
    goldPerKill:       has('q4') ? 1 : 0,
    legendaryBonus:    has('q5') ? 0.20 : 0,
    berserkerOnKill:   has('w5'),
    executeBonus:      has('w4'),
    critAppliesCripple: has('w3'),
    bloodlust:         has('w6'),
    scavengerInstinct: has('q6'),
  }
}
