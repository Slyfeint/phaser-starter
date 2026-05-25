import Phaser from 'phaser'
import { SLOT_ORDER } from '../systems/Inventory'
import type { EquipSlot } from '../systems/ItemDefs'
import { RARITY_COLOR } from '../systems/Rarity'
import { BAG_CAPACITY } from '../systems/Bag'
import type { Player } from '../entities/Player'

const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon1: 'WPN 1', weapon2: 'WPN 2',
  helm: 'HELM', chest: 'CHEST', legs: 'LEGS',
  gloves: 'GLOVES', ring: 'RING', necklace: 'NECK',
}

export class InventoryUI {
  private scene: Phaser.Scene
  private objects: Phaser.GameObjects.GameObject[] = []
  private open = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  toggle(player: Player) {
    if (this.open) {
      this.close()
    } else {
      this.open = true
      this.rebuild(player)
    }
  }

  private close() {
    this.open = false
    this.objects.forEach(o => o.destroy())
    this.objects = []
  }

  private rebuild(player: Player) {
    const scene = this.scene
    const { width, height } = scene.scale
    const pw = 370, ph = 350
    const px = (width - pw) / 2
    const py = (height - ph) / 2

    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.objects.push(o)
      return o
    }

    add(scene.add.rectangle(px, py, pw, ph, 0x000000, 0.93).setOrigin(0).setScrollFactor(0).setDepth(50))
    add(scene.add.rectangle(px + 1, py + 1, pw - 2, ph - 2, 0, 0)
      .setOrigin(0).setScrollFactor(0).setDepth(50).setStrokeStyle(1, 0x00ffcc, 0.4))
    add(scene.add.text(px + pw / 2, py + 8, 'INVENTORY  [I] close', { fontSize: '11px', color: '#00ffcc' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))

    add(scene.add.rectangle(px + pw / 2, py + 26, 1, ph - 32, 0x224433)
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(50))

    // Left: equipped gear
    add(scene.add.text(px + pw * 0.25, py + 28, 'EQUIPPED', { fontSize: '8px', color: '#445566' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))

    SLOT_ORDER.forEach((slot, i) => {
      const sy = py + 42 + i * 36
      add(scene.add.text(px + 10, sy, SLOT_LABELS[slot as EquipSlot], { fontSize: '7px', color: '#334455' })
        .setScrollFactor(0).setDepth(51))
      const item = player.inventory.get(slot as EquipSlot)
      let str = '--'
      let color = '#445566'
      if (item) {
        str = item.name
        if (item.bonusMaxHp)    str += ` +${item.bonusMaxHp}hp`
        if (item.bonusArmor)    str += ` +${item.bonusArmor}arm`
        if (item.bonusSpeed)    str += ` +${item.bonusSpeed}spd`
        if (item.bonusCrit)     str += ` +${Math.round((item.bonusCrit ?? 0) * 100)}%crit`
        color = RARITY_COLOR[item.rarity] ?? '#aaaaaa'
      }
      add(scene.add.text(px + 10, sy + 10, str, { fontSize: '10px', color })
        .setScrollFactor(0).setDepth(51))
    })

    // Right: bag
    const bagUsed = player.bag.usedCells
    add(scene.add.text(px + pw * 0.75, py + 28, `BAG  ${bagUsed}/${BAG_CAPACITY}`, { fontSize: '8px', color: '#445566' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))
    add(scene.add.text(px + pw * 0.75, py + 38, 'tap consumable to use', { fontSize: '7px', color: '#2a3a4a' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))

    const bagItems = player.bag.getAll()
    if (bagItems.length === 0) {
      add(scene.add.text(px + pw / 2 + 8, py + 58, '(empty)', { fontSize: '10px', color: '#334455' })
        .setScrollFactor(0).setDepth(51))
    } else {
      bagItems.forEach((item, i) => {
        const sy = py + 52 + i * 26
        const color = RARITY_COLOR[item.rarity] ?? '#aaaaaa'
        const suffix = item.slotType === 'consumable' ? ' [use]' : ` (${item.bagSize})`
        const txt = add(scene.add.text(px + pw / 2 + 8, sy, `${item.name}${suffix}`,
          { fontSize: '10px', color }).setScrollFactor(0).setDepth(51)) as Phaser.GameObjects.Text

        if (item.slotType === 'consumable') {
          txt.setInteractive({ useHandCursor: true })
          txt.on('pointerover', () => txt.setAlpha(0.7))
          txt.on('pointerout',  () => txt.setAlpha(1))
          txt.on('pointerdown', () => {
            const removed = player.bag.remove(i)
            if (removed?.healAmount) player.heal(removed.healAmount)
            this.close()
            this.open = true
            this.rebuild(player)
          })
        }
      })
    }
  }

  refresh(player: Player) {
    if (!this.open) return
    this.close()
    this.open = true
    this.rebuild(player)
  }

  isOpen() { return this.open }
}
