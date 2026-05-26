export type ClassId = 'rogue' | 'ranger' | 'mage'

export interface ClassDef {
  id: ClassId
  name: string
  tagline: string
  color: string
  abilityE: { name: string; desc: string; cooldown: number }
  abilityR: { name: string; desc: string; cooldown: number }
}

export const CLASSES: ClassDef[] = [
  {
    id: 'rogue', name: 'Rogue', tagline: 'Speed. Stealth. Strikes.',
    color: '#aa44ff',
    abilityE: { name: 'Shadow Step', desc: 'Teleport 130px forward, gain 400ms i-frames', cooldown: 8000 },
    abilityR: { name: 'Smoke Veil',  desc: 'Blind nearby enemies for 3s', cooldown: 12000 },
  },
  {
    id: 'ranger', name: 'Ranger', tagline: 'Range. Traps. Precision.',
    color: '#44cc44',
    abilityE: { name: 'Aimed Shot',  desc: 'Charge 1s for 3x damage arrow', cooldown: 6000 },
    abilityR: { name: 'Bear Trap',   desc: 'Place trap - roots enemy 2.5s', cooldown: 15000 },
  },
  {
    id: 'mage', name: 'Mage', tagline: 'Power. Control. Destruction.',
    color: '#4488ff',
    abilityE: { name: 'Arcane Burst', desc: '80px AoE at cursor, 70 dmg + slow', cooldown: 7000 },
    abilityR: { name: 'Blink',        desc: 'Teleport 140px forward instantly', cooldown: 5000 },
  },
]
