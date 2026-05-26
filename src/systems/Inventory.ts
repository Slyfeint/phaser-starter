import type { EquipSlot, SlotType, ItemDef } from './ItemDefs'
import { getScaledWeapon } from './ItemDefs'
import type { WeaponDef } from './WeaponDefs'

export const SLOT_ORDER: EquipSlot[] = ['weapon1','weapon2','helm','chest','legs','gloves','ring','necklace']

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
      slot = item.slotType as Exclude<SlotType,'weapon'|'consumable'>
    }
    const prev = this.slots.get(slot) ?? null
    this.slots.set(slot, item)
    return prev
  }

  unequip(slot: EquipSlot): ItemDef | null {
    const item = this.slots.get(slot) ?? null
    this.slots.delete(slot)
    return item
  }

  get(slot: EquipSlot): ItemDef | undefined { return this.slots.get(slot) }

  getAll(): Array<[EquipSlot, ItemDef]> {
    return SLOT_ORDER.map(s => [s, this.slots.get(s)!]).filter(([,v]) => v) as Array<[EquipSlot, ItemDef]>
  }

  serialize(): Record<string, ItemDef> {
    const out: Record<string, ItemDef> = {}
    for (const [s, item] of this.slots) out[s] = item
    return out
  }

  deserialize(data: Record<string, ItemDef>) {
    this.slots.clear()
    for (const [s, item] of Object.entries(data)) {
      this.slots.set(s as EquipSlot, item)
    }
  }

  getActiveSets(): string[] {
    const counts = new Map<string, number>()
    for (const item of this.slots.values()) {
      if (item.setId) counts.set(item.setId, (counts.get(item.setId) ?? 0) + 1)
    }
    const active: string[] = []
    for (const [id, count] of counts) { if (count >= 2) active.push(id) }
    return active
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
        s[slot] = getScaledWeapon(item)
      }
    }
    return s
  }
}
