import Phaser from 'phaser'
import { SLOT_ORDER } from '../systems/Inventory'
import type { Inventory } from '../systems/Inventory'
import type { EquipSlot } from '../systems/ItemDefs'

const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon1: 'WEAPON 1', weapon2: 'WEAPON 2',
  helm: 'HELM', chest: 'CHEST', legs: 'LEGS',
  gloves: 'GLOVES', ring: 'RING', necklace: 'NECKLACE',
}

const RARITY_COLORS = { common: '#cccccc', rare: '#4488ff', epic: '#aa44ff' }

export class InventoryUI {
  private bg: Phaser.GameObjects.Rectangle
  private title: Phaser.GameObjects.Text
  private slotLabels: Phaser.GameObjects.Text[]
  private slotValues: Phaser.GameObjects.Text[]
  private open = false

  constructor(scene: Phaser.Scene) {
    const { width, height } = scene.scale
    const pw = 270, ph = 310
    const px = (width - pw) / 2
    const py = (height - ph) / 2

    this.bg = scene.add.rectangle(px, py, pw, ph, 0x000000, 0.88)
      .setOrigin(0).setScrollFactor(0).setDepth(50).setVisible(false)

    this.title = scene.add.text(px + pw / 2, py + 12, 'INVENTORY  [I] close', {
      fontSize: '13px', color: '#00ffcc',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51).setVisible(false)

    this.slotLabels = []
    this.slotValues = []

    SLOT_ORDER.forEach((slot, i) => {
      const sy = py + 38 + i * 32
      const lbl = scene.add.text(px + 12, sy, SLOT_LABELS[slot], { fontSize: '9px', color: '#445566' })
        .setScrollFactor(0).setDepth(51).setVisible(false)
      const val = scene.add.text(px + 12, sy + 11, '--', { fontSize: '12px', color: '#667788' })
        .setScrollFactor(0).setDepth(51).setVisible(false)
      this.slotLabels.push(lbl)
      this.slotValues.push(val)
    })
  }

  toggle(inventory: Inventory) {
    this.open = !this.open
    const v = this.open
    this.bg.setVisible(v)
    this.title.setVisible(v)
    this.slotLabels.forEach(l => l.setVisible(v))
    this.slotValues.forEach(l => l.setVisible(v))
    if (v) this.refresh(inventory)
  }

  refresh(inventory: Inventory) {
    SLOT_ORDER.forEach((slot, i) => {
      const item = inventory.get(slot)
      if (!item) {
        this.slotValues[i].setText('--').setColor('#445566')
        return
      }
      let str = item.name
      if (item.bonusMaxHp)    str += `  +${item.bonusMaxHp} HP`
      if (item.bonusArmor)    str += `  +${item.bonusArmor}% armor`
      if (item.bonusSpeed)    str += `  +${item.bonusSpeed} spd`
      if (item.bonusCrit)     str += `  +${Math.round(item.bonusCrit * 100)}% crit`
      if (item.bonusLootMult) str += `  ×${item.bonusLootMult} loot`
      this.slotValues[i].setText(str).setColor(RARITY_COLORS[item.rarity])
    })
  }

  isOpen() { return this.open }
}
