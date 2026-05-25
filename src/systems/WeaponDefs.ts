export type WeaponType = 'sword' | 'spear' | 'mace' | 'dagger'

export interface WeaponDef {
  type: WeaponType
  name: string
  damage: number
  range: number
  cooldown: number
  knockback: number
  arcAngle: number
  arcColor: number
}

export const WEAPONS: Record<WeaponType, WeaponDef> = {
  sword:  { type: 'sword',  name: 'Sword',  damage: 25, range: 55, cooldown: 300, knockback: 180, arcAngle: 60,  arcColor: 0xffffaa },
  spear:  { type: 'spear',  name: 'Spear',  damage: 35, range: 80, cooldown: 500, knockback: 90,  arcAngle: 20,  arcColor: 0xaaffaa },
  mace:   { type: 'mace',   name: 'Mace',   damage: 50, range: 45, cooldown: 800, knockback: 320, arcAngle: 90,  arcColor: 0xff9966 },
  dagger: { type: 'dagger', name: 'Dagger', damage: 15, range: 35, cooldown: 150, knockback: 30,  arcAngle: 15,  arcColor: 0xaaffff },
}
