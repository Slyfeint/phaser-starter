export interface SynergyContext {
  equippedSlots: string[]        // weapon types equipped: 'dagger', 'staff', etc.
  cosmeticId: string
  skills: string[]               // unlocked skill IDs
  hasBothWeapons: boolean        // weapon1 and weapon2 both equipped
}

export interface SynergyDef {
  id: string
  name: string
  description: string
  check: (ctx: SynergyContext) => boolean
  apply: (ctx: SynergyContext) => void
}

export const SYNERGIES: SynergyDef[] = [
  {
    id: 'shadowblade',
    name: 'Shadowblade',
    description: 'Crits apply extra bleed (1500ms)',
    check: (ctx) =>
      ctx.equippedSlots.includes('dagger') &&
      ctx.cosmeticId === 'shadow' &&
      (ctx.skills.includes('w2') || ctx.skills.includes('w1')),
    apply: (_ctx) => { /* flag set in DungeonScene */ },
  },
  {
    id: 'arcane_slowing',
    name: 'Arcane Slowing',
    description: 'Slowed enemies take +20% damage',
    check: (ctx) =>
      ctx.equippedSlots.includes('staff') &&
      ctx.skills.includes('s4'),
    apply: (_ctx) => { /* flag set in DungeonScene */ },
  },
  {
    id: 'iron_counter',
    name: 'Iron Counter',
    description: 'Reflected damage also stuns for 600ms',
    check: (ctx) =>
      ctx.equippedSlots.includes('mace') &&
      ctx.skills.includes('s1') &&
      ctx.skills.includes('s2'),
    apply: (_ctx) => { /* flag set in DungeonScene */ },
  },
  {
    id: 'berserkers_gambit',
    name: "Berserker's Gambit",
    description: 'Below 30% HP: deal 1.5x damage',
    check: (ctx) =>
      ctx.skills.includes('w5') &&
      ctx.skills.includes('s5'),
    apply: (_ctx) => { /* flag set in DungeonScene */ },
  },
  {
    id: 'dual_wield_flow',
    name: 'Dual Wield Flow',
    description: 'Weapon swap grants 400ms +30% speed',
    check: (ctx) => ctx.hasBothWeapons,
    apply: (_ctx) => { /* flag set in DungeonScene */ },
  },
  {
    id: 'fortunes_edge',
    name: "Fortune's Edge",
    description: 'Every kill has +5% chance for extra gold',
    check: (ctx) =>
      ctx.skills.includes('q5') &&
      ctx.skills.includes('q1') &&
      ctx.cosmeticId === 'gold',
    apply: (_ctx) => { /* flag set in DungeonScene */ },
  },
]

export function checkSynergies(ctx: SynergyContext): string[] {
  return SYNERGIES.filter(s => s.check(ctx)).map(s => s.id)
}
