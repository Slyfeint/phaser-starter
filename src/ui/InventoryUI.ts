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
    const pw = 450, ph = 430
    const px = (width - pw) / 2
    const py = (height - ph) / 2

    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.objects.push(o)
      return o
    }

    // Panel background
    add(scene.add.rectangle(px, py, pw, ph, 0x000000, 0.95).setOrigin(0).setScrollFactor(0).setDepth(50))
    add(scene.add.rectangle(px + 1, py + 1, pw - 2, ph - 2, 0, 0)
      .setOrigin(0).setScrollFactor(0).setDepth(50).setStrokeStyle(2, 0x00ffcc, 0.6))

    // Title
    add(scene.add.text(px + pw / 2, py + 10, 'INVENTORY  [I] close', {
      fontSize: '13px', color: '#00ffcc', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))

    // Divider
    add(scene.add.rectangle(px + pw / 2, py + 32, 1, ph - 38, 0x224433)
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(50))

    // ── Left panel: equipped gear ──
    add(scene.add.text(px + pw * 0.25, py + 34, 'EQUIPPED  (click to unequip)', {
      fontSize: '9px', color: '#445566',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))

    SLOT_ORDER.forEach((slot, i) => {
      const sy = py + 50 + i * 44
      const col = RARITY_COLOR

      // Slot row background (clickable area)
      const rowBg = add(scene.add.rectangle(px + 8, sy, pw / 2 - 16, 40, 0x111122, 0.6)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(50))

      add(scene.add.text(px + 12, sy + 4, SLOT_LABELS[slot as EquipSlot], {
        fontSize: '9px', color: '#334455',
      }).setScrollFactor(0).setDepth(51))

      const item = player.inventory.get(slot as EquipSlot)

      if (item) {
        let str = item.name
        const stats: string[] = []
        if (item.bonusMaxHp)    stats.push(`+${item.bonusMaxHp}hp`)
        if (item.bonusArmor)    stats.push(`+${item.bonusArmor}arm`)
        if (item.bonusSpeed)    stats.push(`+${item.bonusSpeed}spd`)
        if (item.bonusCrit)     stats.push(`+${Math.round((item.bonusCrit ?? 0) * 100)}%crit`)
        if (stats.length) str += '  ' + stats.join(' ')

        const itemColor = col[item.rarity] ?? '#aaaaaa'
        const itemTxt = add(scene.add.text(px + 12, sy + 18, str, {
          fontSize: '12px', color: itemColor,
        }).setScrollFactor(0).setDepth(51))

        // Make the row interactive for unequip
        rowBg.setInteractive({ useHandCursor: true })
        rowBg.on('pointerover', () => { rowBg.setFillStyle(0x223344, 0.8); itemTxt.setAlpha(0.8) })
        rowBg.on('pointerout',  () => { rowBg.setFillStyle(0x111122, 0.6); itemTxt.setAlpha(1) })
        rowBg.on('pointerdown', () => {
          const unequipped = player.inventory.unequip(slot as EquipSlot)
          if (unequipped) {
            if (player.bag.canAdd(unequipped)) {
              player.bag.add(unequipped)
            } else {
              // Bag full — put it back rather than deleting it
              player.inventory.equipItem(unequipped)
              return
            }
          }
          this.close()
          this.open = true
          this.rebuild(player)
        })
      } else {
        add(scene.add.text(px + 12, sy + 18, '--', { fontSize: '12px', color: '#333344' })
          .setScrollFactor(0).setDepth(51))
      }
    })

    // ── Right panel: bag ──
    const bagUsed = player.bag.usedCells
    const rpx = px + pw / 2 + 8

    add(scene.add.text(rpx + (pw / 2 - 16) / 2, py + 34, `BAG  ${bagUsed}/${BAG_CAPACITY}`, {
      fontSize: '9px', color: '#445566',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))

    add(scene.add.text(rpx + (pw / 2 - 16) / 2, py + 46, 'gear: click to equip  |  consumable: click to use', {
      fontSize: '7px', color: '#2a3a4a',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))

    const bagItems = player.bag.getAll()
    if (bagItems.length === 0) {
      add(scene.add.text(rpx, py + 62, '(empty)', { fontSize: '12px', color: '#334455' })
        .setScrollFactor(0).setDepth(51))
    } else {
      bagItems.forEach((item, i) => {
        const sy = py + 58 + i * 34
        const itemColor = RARITY_COLOR[item.rarity] ?? '#aaaaaa'
        const isConsumable = item.slotType === 'consumable'
        const suffix = isConsumable ? '  [use]' : `  [${item.rarity}]`

        // Row background
        const rowBg = add(scene.add.rectangle(rpx, sy, pw / 2 - 20, 30, 0x111122, 0.5)
          .setOrigin(0, 0).setScrollFactor(0).setDepth(50))

        const txt = add(scene.add.text(rpx + 6, sy + 8, `${item.name}${suffix}`, {
          fontSize: '12px', color: itemColor,
        }).setScrollFactor(0).setDepth(51)) as Phaser.GameObjects.Text

        rowBg.setInteractive({ useHandCursor: true })
        rowBg.on('pointerover', () => { rowBg.setFillStyle(0x223344, 0.8); txt.setAlpha(0.8) })
        rowBg.on('pointerout',  () => { rowBg.setFillStyle(0x111122, 0.5); txt.setAlpha(1) })

        if (isConsumable) {
          rowBg.on('pointerdown', () => {
            const removed = player.bag.remove(i)
            if (removed) player.useConsumable(removed)
            this.close()
            this.open = true
            this.rebuild(player)
          })
        } else {
          rowBg.on('pointerdown', () => {
            // Equip from bag: remove from bag, equip (displaced goes back to bag)
            const bagItem = player.bag.remove(i)
            if (!bagItem) return
            const displaced = player.inventory.equipItem(bagItem)
            if (displaced && player.bag.canAdd(displaced)) {
              player.bag.add(displaced)
            }
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
