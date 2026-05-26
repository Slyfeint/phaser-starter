import Phaser from 'phaser'
import { SLOT_ORDER } from '../systems/Inventory'
import type { EquipSlot } from '../systems/ItemDefs'
import { getScaledWeapon } from '../systems/ItemDefs'
import { RARITY_COLOR } from '../systems/Rarity'
import {} from '../systems/Bag'
import type { Player } from '../entities/Player'
import { SaveManager } from '../systems/SaveManager'
import { QUESTS } from '../systems/QuestDefs'

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
    const pw = 450, ph = 470
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
    add(scene.add.text(px + pw * 0.25, py + 34, 'EQUIPPED  (click to unequip  [x] drop)', {
      fontSize: '8px', color: '#445566',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))

    SLOT_ORDER.forEach((slot, i) => {
      const sy = py + 50 + i * 44

      // Slot row background — narrower to avoid overlap with drop button
      const rowBg = add(scene.add.rectangle(px + 8, sy, pw / 2 - 48, 40, 0x111122, 0.6)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(50))

      add(scene.add.text(px + 12, sy + 4, SLOT_LABELS[slot as EquipSlot], {
        fontSize: '9px', color: '#334455',
      }).setScrollFactor(0).setDepth(51))

      const item = player.inventory.get(slot as EquipSlot)

      if (item) {
        let str = item.name
        const stats: string[] = []
        if (item.slotType === 'weapon') {
          const wd = getScaledWeapon(item)
          if (wd) stats.push(`dmg ${wd.damage}`, `rng ${wd.range}`, `cd ${(wd.cooldown / 1000).toFixed(1)}s`)
        } else {
          if (item.bonusMaxHp)  stats.push(`+${item.bonusMaxHp}hp`)
          if (item.bonusArmor)  stats.push(`+${item.bonusArmor}arm`)
          if (item.bonusSpeed)  stats.push(`+${item.bonusSpeed}spd`)
          if (item.bonusCrit)   stats.push(`+${Math.round((item.bonusCrit ?? 0) * 100)}%crit`)
        }
        if (stats.length) str += '  ' + stats.join(' ')

        const itemColor = RARITY_COLOR[item.rarity] ?? '#aaaaaa'
        const itemTxt = add(scene.add.text(px + 12, sy + 18, str, {
          fontSize: '12px', color: itemColor,
        }).setScrollFactor(0).setDepth(51))

        // Unequip on row click
        rowBg.setInteractive({ useHandCursor: true })
        rowBg.on('pointerover', () => { rowBg.setFillStyle(0x223344, 0.8); itemTxt.setAlpha(0.8) })
        rowBg.on('pointerout',  () => { rowBg.setFillStyle(0x111122, 0.6); itemTxt.setAlpha(1) })
        rowBg.on('pointerdown', () => {
          const unequipped = player.inventory.unequip(slot as EquipSlot)
          if (unequipped) {
            if (player.bag.canAdd(unequipped)) {
              player.bag.add(unequipped)
            } else {
              player.inventory.equipItem(unequipped)
              return
            }
          }
          this.close()
          this.open = true
          this.rebuild(player)
        })

        // Drop button (right of rowBg, doesn't overlap)
        const dropBtn = add(scene.add.text(px + pw / 2 - 10, sy + 14, '[x]', {
          fontSize: '9px', color: '#663333',
        }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(52).setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Text
        dropBtn.on('pointerover', () => dropBtn.setColor('#ff4444'))
        dropBtn.on('pointerout',  () => dropBtn.setColor('#663333'))
        dropBtn.on('pointerdown', (_p: unknown, _lx: unknown, _ly: unknown, ev: { stopPropagation(): void }) => {
          ev.stopPropagation()
          const dropped = player.inventory.unequip(slot as EquipSlot)
          if (dropped) scene.events.emit('inventory-drop-item', dropped)
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

    add(scene.add.text(rpx + (pw / 2 - 16) / 2, py + 34, `BAG  ${bagUsed}/${player.bag.capacity}`, {
      fontSize: '9px', color: '#445566',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))

    add(scene.add.text(rpx + (pw / 2 - 16) / 2, py + 46, 'gear: equip  |  consumable: use  |  [x] drop', {
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

        // Row background — shorter width to leave room for drop [x]
        const rowBg = add(scene.add.rectangle(rpx, sy, pw / 2 - 52, 30, 0x111122, 0.5)
          .setOrigin(0, 0).setScrollFactor(0).setDepth(50))

        const txt = add(scene.add.text(rpx + 6, sy + 8, `${item.name}${suffix}`, {
          fontSize: '11px', color: itemColor,
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

        // Drop button
        const dropBtn = add(scene.add.text(rpx + pw / 2 - 22, sy + 9, '[x]', {
          fontSize: '9px', color: '#663333',
        }).setScrollFactor(0).setDepth(52).setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Text
        dropBtn.on('pointerover', () => dropBtn.setColor('#ff4444'))
        dropBtn.on('pointerout',  () => dropBtn.setColor('#663333'))
        dropBtn.on('pointerdown', (_p: unknown, _lx: unknown, _ly: unknown, ev: { stopPropagation(): void }) => {
          ev.stopPropagation()
          const removed = player.bag.remove(i)
          if (removed) scene.events.emit('inventory-drop-item', removed)
          this.close()
          this.open = true
          this.rebuild(player)
        })
      })
    }

    // ── Quest compact strip ──
    const save = SaveManager.load()
    const activeQuests = save.quests?.active ?? []
    const qsy = py + ph - 42
    add(scene.add.rectangle(px, qsy, pw, 40, 0x060f0a, 0.9)
      .setOrigin(0).setScrollFactor(0).setDepth(50).setStrokeStyle(1, 0x1a2a1a))
    add(scene.add.text(px + pw / 2, qsy + 2, 'QUESTS', { fontSize: '8px', fontStyle: 'bold', color: '#336633' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))
    activeQuests.slice(0, 3).forEach((qid, i) => {
      const def = QUESTS.find(q => q.id === qid)
      if (!def) return
      const prog = save.quests?.progress[qid] ?? 0
      const qx = px + 10 + i * (pw / 3)
      add(scene.add.text(qx, qsy + 14, `${def.title}`, { fontSize: '8px', fontStyle: 'bold', color: '#446644' })
        .setScrollFactor(0).setDepth(51))
      add(scene.add.text(qx, qsy + 26, `${prog}/${def.target}`, { fontSize: '8px', color: '#335533' })
        .setScrollFactor(0).setDepth(51))
    })
  }

  refresh(player: Player) {
    if (!this.open) return
    this.close()
    this.open = true
    this.rebuild(player)
  }

  isOpen() { return this.open }
}
