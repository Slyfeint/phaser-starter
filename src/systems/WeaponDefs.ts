export type WeaponType = 'sword' | 'spear' | 'mace' | 'dagger' | 'axe' | 'staff' | 'bow' | 'dual_dagger'

export interface WeaponDef {
  type: WeaponType
  name: string
  damage: number
  range: number
  cooldown: number
  knockback: number
  arcAngle: number
  arcColor: number
  projectile?: boolean
  slowOnHit?: boolean
  projectileSpeed?: number
  dualHit?: boolean
}

export const WEAPONS: Record<WeaponType, WeaponDef> = {
  sword:       { type: 'sword',       name: 'Sword',       damage: 25, range: 62,  cooldown: 300, knockback: 180, arcAngle: 70,  arcColor: 0xffffaa },
  spear:       { type: 'spear',       name: 'Spear',       damage: 35, range: 80,  cooldown: 500, knockback: 90,  arcAngle: 20,  arcColor: 0xaaffaa },
  mace:        { type: 'mace',        name: 'Mace',        damage: 50, range: 45,  cooldown: 800, knockback: 320, arcAngle: 105, arcColor: 0xff9966 },
  dagger:      { type: 'dagger',      name: 'Dagger',      damage: 15, range: 48,  cooldown: 150, knockback: 30,  arcAngle: 65,  arcColor: 0xaaffff },
  axe:         { type: 'axe',         name: 'Axe',         damage: 42, range: 58,  cooldown: 600, knockback: 180, arcAngle: 80,  arcColor: 0xffaa44 },
  staff:       { type: 'staff',       name: 'Staff',       damage: 44, range: 200, cooldown: 900, knockback: 0,   arcAngle: 0,   arcColor: 0xaa44ff, projectile: true, slowOnHit: true, projectileSpeed: 280 },
  bow:         { type: 'bow',         name: 'Bow',         damage: 38, range: 240, cooldown: 580, knockback: 20,  arcAngle: 0,   arcColor: 0x88ff44, projectile: true,  projectileSpeed: 420 },
  dual_dagger: { type: 'dual_dagger', name: 'Twin Blades', damage: 18, range: 50,  cooldown: 190, knockback: 25,  arcAngle: 65,  arcColor: 0xff88cc, dualHit: true },
}
