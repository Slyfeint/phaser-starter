export interface CosmeticDef {
  id: string
  name: string
  tint: number
  price: number
  fromBoss: boolean
}

export const COSMETICS: CosmeticDef[] = [
  { id: 'steel',   name: 'Steel',   tint: 0xffffff, price: 0,    fromBoss: false },
  { id: 'crimson', name: 'Crimson', tint: 0xff5555, price: 500,  fromBoss: false },
  { id: 'forest',  name: 'Forest',  tint: 0x44cc44, price: 500,  fromBoss: false },
  { id: 'ocean',   name: 'Ocean',   tint: 0x4488ff, price: 750,  fromBoss: false },
  { id: 'shadow',  name: 'Shadow',  tint: 0x9944bb, price: 1000, fromBoss: false },
  { id: 'gold',    name: 'Gold',    tint: 0xffcc00, price: 1500, fromBoss: false },
  { id: 'void',    name: 'Void',    tint: 0x220066, price: 0,    fromBoss: true  },
  { id: 'blood',   name: 'Blood',   tint: 0x880011, price: 0,    fromBoss: true  },
]
