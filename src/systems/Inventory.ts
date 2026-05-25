import type { EquipSlot, SlotType, ItemDef } from './ItemDefs'
import type { WeaponDef } from './WeaponDefs'
import { WEAPONS } from './WeaponDefs'

export const SLOT_ORDER: EquipSlot[] = ['weapon1', 'weapon2', 'helm', 'chest', 'legs', 'gloves', 'ring', 'necklace']

export interface EquipStats {
  maxHpBonus: number
  armor: number
  speedBonus: number
  atkSpeedMult: number
  critChance: number
  lootMult: number
  weapon1: WeaponDef | null
  weapon2: WeaponDef | null
}

export class Inventory {
  private slots = new Map<EquipSlot, ItemDef>()

  equipItem(item: ItemDef, forceSlot?: 'weapon1' | 'weapon2'): ItemDef | null {
    let slot: EquipSlot
    if (item.slotType === 'weapon') {
      if (forceSlot) {
        slot = forceSlot
      } else if (!this.slots.has('weapon1')) {
        slot = 'weapon1'
      } else if (!this.slots.has('weapon2')) {
        slot = 'weapon2'
      } else {
        slot = 'weapon1'
      }
    } else {
      slot = item.slotType as Exclude<SlotType, 'weapon'>
    }
    const prev = this.slots.get(slot) ?? null
    this.slots.set(slot, item)
    return prev
  }

  get(slot: EquipSlot): ItemDef | undefined {
    return this.slots.get(slot)
  }

  getStats(): EquipStats {
    const s: EquipStats = {
      maxHpBonus: 0, armor: 0, speedBonus: 0,
      atkSpeedMult: 1, critChance: 0, lootMult: 1,
      weapon1: null, weapon2: null,
    }
    for (const [slot, item] of this.slots) {
      if (item.bonusMaxHp)    s.maxHpBonus   += item.bonusMaxHp
      if (item.bonusArmor)    s.armor         += item.bonusArmor
      if (item.bonusSpeed)    s.speedBonus    += item.bonusSpeed
      if (item.bonusAtkSpeed) s.atkSpeedMult  *= item.bonusAtkSpeed
      if (item.bonusCrit)     s.critChance    += item.bonusCrit
      if (item.bonusLootMult) s.lootMult      *= item.bonusLootMult
      if ((slot === 'weapon1' || slot === 'weapon2') && item.weaponType) {
        s[slot] = WEAPONS[item.weaponType]
      }
    }
    return s
  }
}
