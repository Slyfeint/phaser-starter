export interface RunModifierDef {
  id: string
  title: string
  desc: string
  icon: string
  goldMult?: number
  speedMult?: number
  hpMult?: number
  damageMult?: number
  lootMult?: number
}

export const RUN_MODIFIERS: RunModifierDef[] = [
  {
    id: 'fast_enemies',
    title: 'Swift Horde',
    desc: 'Enemies move 25% faster, but gold drops are doubled',
    icon: '!',
    speedMult: 1.25,
    goldMult: 2.0,
  },
  {
    id: 'glass_world',
    title: 'Brittle World',
    desc: 'All enemies have -30% HP, but deal +20% damage',
    icon: 'X',
    hpMult: 0.7,
    damageMult: 1.2,
  },
  {
    id: 'treasure_run',
    title: 'Treasure Run',
    desc: 'Loot quality doubled, but enemies have +40% HP',
    icon: '$',
    lootMult: 2.0,
    hpMult: 1.4,
  },
  {
    id: 'cursed_run',
    title: 'Cursed Descent',
    desc: 'Player starts at 50% HP but earns 50% more gold',
    icon: '*',
    goldMult: 1.5,
  },
  {
    id: 'blessed_run',
    title: 'Blessed Descent',
    desc: 'All items found are at least uncommon rarity',
    icon: '+',
  },
  {
    id: 'elite_hunt',
    title: 'Elite Hunt',
    desc: 'Every room has a miniboss, 2x elite loot',
    icon: '#',
  },
]
