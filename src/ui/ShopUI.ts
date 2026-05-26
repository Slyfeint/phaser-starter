import Phaser from 'phaser'
import { ITEMS, getScaledWeapon } from '../systems/ItemDefs'
import type { ItemDef, EquipSlot } from '../systems/ItemDefs'
import { RARITY_COLOR } from '../systems/Rarity'
import { SLOT_ORDER } from '../systems/Inventory'
import type { Player } from '../entities/Player'

const GEAR_PRICES: Record<string, number> = {
  common: 60, uncommon: 120, rare: 250, epic: 600, legendary: 1500,
}
const CONSUMABLE_PRICES: Record<string, number> = {
  bandage: 30, greater_bandage: 60, elixir: 120,
}
const CONSUMABLE_SELL: Record<string, number> = {
  bandage: 12, greater_bandage: 24, elixir: 48,
}
export const SELL_PRICES: Record<string, number> = {
  common: 24, uncommon: 48, rare: 100, epic: 240, legendary: 600,
}

export function getSellPrice(item: ItemDef): number {
  if (item.slotType === 'consumable') return CONSUMABLE_SELL[item.id] ?? 12
  return SELL_PRICES[item.rarity] ?? 24
}

export class ShopUI {
  private scene: Phaser.Scene
  private objects: Phaser.GameObjects.GameObject[] = []
  private _open = false
  private shopItems: ItemDef[]
  private goldLabel?: Phaser.GameObjects.Text
  private currentGoldGetter?: () => number
  private currentOnBuy?: (item: ItemDef, price: number) => boolean
  private currentGetPlayer?: () => Player
  private currentOnSell?: (item: ItemDef, source: 'equipped' | 'bag', slotOrIdx: string | number) => void

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.shopItems = this.generateItems()
  }

  private generateItems(): ItemDef[] {
    const gear = ITEMS.filter(i => i.slotType !== 'consumable')
    const consumables = ITEMS.filter(i => i.slotType === 'consumable')
    Phaser.Utils.Array.Shuffle(gear)
    Phaser.Utils.Array.Shuffle(consumables)
    return [...gear.slice(0, 3), ...consumables.slice(0, 2)]
  }

  open(
    getGold: () => number,
    onBuy: (item: ItemDef, price: number) => boolean,
    getPlayer: () => Player,
    onSell: (item: ItemDef, source: 'equipped' | 'bag', slotOrIdx: string | number) => void,
  ) {
    if (this._open) return
    this._open = true
    this.currentGoldGetter = getGold
    this.currentOnBuy = onBuy
    this.currentGetPlayer = getPlayer
    this.currentOnSell = onSell
    this.buildUI()
  }

  close() {
    this._open = false
    this.objects.forEach(o => o.destroy())
    this.objects = []
    this.goldLabel = undefined
    this.currentGoldGetter = undefined
    this.currentOnBuy = undefined
    this.currentGetPlayer = undefined
    this.currentOnSell = undefined
  }

  private rebuild() {
    this.objects.forEach(o => o.destroy())
    this.objects = []
    this.goldLabel = undefined
    this.buildUI()
  }

  private buildUI() {
    const scene = this.scene
    const { width, height } = scene.scale
    const pw = 480, ph = 350
    const px = (width - pw) / 2
    const py = (height - ph) / 2
    const lcw = 222   // left (buy) column usable width
    const divx = px + lcw + 10
    const rcx = divx + 6
    const rcw = pw - lcw - 24

    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.objects.push(o)
      return o
    }

    // Panel
    add(scene.add.rectangle(px, py, pw, ph, 0x000000, 0.93).setOrigin(0).setScrollFactor(0).setDepth(50))
    add(scene.add.rectangle(px + 1, py + 1, pw - 2, ph - 2, 0, 0)
      .setOrigin(0).setScrollFactor(0).setDepth(50).setStrokeStyle(1, 0xffd700, 0.5))

    // Title + gold
    add(scene.add.text(px + pw / 2, py + 8, 'SHOP  [TAB] close', { fontSize: '12px', color: '#ffd700' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))
    this.goldLabel = add(scene.add.text(px + pw / 2, py + 24, `Gold: ${this.currentGoldGetter?.() ?? 0}`,
      { fontSize: '10px', color: '#ffdd88' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51)) as Phaser.GameObjects.Text

    // Column divider
    add(scene.add.rectangle(divx, py + 40, 1, ph - 46, 0x332200)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(50))

    // ── BUY column (left) ──
    add(scene.add.text(px + lcw / 2 + 8, py + 42, 'BUY', { fontSize: '8px', color: '#665500' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))

    const bought = new Set<number>()
    this.shopItems.forEach((item, i) => {
      const sy = py + 56 + i * 48
      const price = item.slotType === 'consumable'
        ? (CONSUMABLE_PRICES[item.id] ?? 40)
        : (GEAR_PRICES[item.rarity] ?? 100)
      const color = RARITY_COLOR[item.rarity] ?? '#aaaaaa'

      add(scene.add.text(px + 8, sy, item.name, { fontSize: '10px', color }).setScrollFactor(0).setDepth(51))
      add(scene.add.text(px + 8, sy + 14, this.desc(item), { fontSize: '7px', color: '#556677' }).setScrollFactor(0).setDepth(51))

      const buyBtn = add(scene.add.text(px + lcw + 4, sy + 8, `[${price}g]`,
        { fontSize: '10px', color: bought.has(i) ? '#556677' : '#ffd700' })
        .setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true }).setOrigin(1, 0)) as Phaser.GameObjects.Text

      buyBtn.on('pointerover', () => { if (!bought.has(i)) buyBtn.setColor('#ffffff') })
      buyBtn.on('pointerout',  () => { if (!bought.has(i)) buyBtn.setColor('#ffd700') })
      buyBtn.on('pointerdown', () => {
        if (bought.has(i)) return
        const success = this.currentOnBuy?.(item, price)
        if (success) {
          bought.add(i)
          buyBtn.setText('[SOLD]').setColor('#334455').disableInteractive()
          if (this.goldLabel && this.currentGoldGetter) {
            this.goldLabel.setText(`Gold: ${this.currentGoldGetter()}`)
          }
        }
      })
    })

    // ── SELL column (right) ──
    add(scene.add.text(rcx + rcw / 2, py + 42, 'SELL  (40% value)', { fontSize: '8px', color: '#554400' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))

    const player = this.currentGetPlayer?.()
    if (!player) return

    let ry = py + 56

    const addSellRow = (item: ItemDef, label: string, source: 'equipped' | 'bag', slotOrIdx: string | number) => {
      if (ry > py + ph - 22) return
      const color = RARITY_COLOR[item.rarity] ?? '#aaaaaa'
      const price = getSellPrice(item)
      const nm = label.length > 17 ? label.substring(0, 16) + '…' : label

      const rowBg = add(scene.add.rectangle(rcx, ry, rcw, 20, 0x111122, 0.5)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(50))
      add(scene.add.text(rcx + 3, ry + 3, nm, { fontSize: '9px', color })
        .setScrollFactor(0).setDepth(51))
      const priceBtn = add(scene.add.text(rcx + rcw - 2, ry + 3, `[${price}g]`,
        { fontSize: '9px', color: '#ffd700' }).setOrigin(1, 0).setScrollFactor(0).setDepth(51)) as Phaser.GameObjects.Text

      const highlight   = () => { rowBg.setFillStyle(0x332200, 0.8); priceBtn.setColor('#ffffff') }
      const unhighlight = () => { rowBg.setFillStyle(0x111122, 0.5); priceBtn.setColor('#ffd700') }
      rowBg.setInteractive({ useHandCursor: true })
      rowBg.on('pointerover', highlight)
      rowBg.on('pointerout', unhighlight)
      priceBtn.setInteractive({ useHandCursor: true })
      priceBtn.on('pointerover', highlight)
      priceBtn.on('pointerout', unhighlight)

      const doSell = () => {
        this.currentOnSell?.(item, source, slotOrIdx)
        this.rebuild()
      }
      rowBg.on('pointerdown', doSell)
      priceBtn.on('pointerdown', doSell)

      ry += 22
    }

    // Equipped items
    let hasEquipped = false
    SLOT_ORDER.forEach(slot => {
      const item = player.inventory.get(slot as EquipSlot)
      if (!item) return
      if (!hasEquipped) {
        add(scene.add.text(rcx, ry, 'EQUIPPED', { fontSize: '7px', color: '#334455' })
          .setScrollFactor(0).setDepth(51))
        ry += 12
        hasEquipped = true
      }
      addSellRow(item, item.name, 'equipped', slot)
    })

    // Bag items
    const bagItems = player.bag.getAll()
    if (bagItems.length > 0) {
      if (ry < py + ph - 22) {
        add(scene.add.text(rcx, ry, 'BAG', { fontSize: '7px', color: '#334455' })
          .setScrollFactor(0).setDepth(51))
        ry += 12
      }
      bagItems.forEach((item, idx) => addSellRow(item, item.name, 'bag', idx))
    }

    if (!hasEquipped && bagItems.length === 0) {
      add(scene.add.text(rcx + rcw / 2, ry + 16, '(nothing to sell)', { fontSize: '9px', color: '#2a3a4a' })
        .setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))
    }
  }

  private desc(item: ItemDef): string {
    if (item.slotType === 'consumable') {
      if (item.healAmount)    return `Heal +${item.healAmount} HP`
      if (item.speedBoostAmt) return `Speed +${item.speedBoostAmt} for ${(item.speedBoostMs ?? 0) / 1000}s`
      if (item.shieldAmount)  return `Shield +${item.shieldAmount} HP`
      return 'Consumable'
    }
    if (item.slotType === 'weapon') {
      const wd = getScaledWeapon(item)
      return wd ? `dmg ${wd.damage}  rng ${wd.range}  cd ${(wd.cooldown / 1000).toFixed(1)}s` : item.rarity
    }
    const parts: string[] = []
    if (item.bonusMaxHp)    parts.push(`+${item.bonusMaxHp} HP`)
    if (item.bonusArmor)    parts.push(`+${item.bonusArmor}% armor`)
    if (item.bonusSpeed)    parts.push(`+${item.bonusSpeed} spd`)
    if (item.bonusCrit)     parts.push(`+${Math.round((item.bonusCrit ?? 0) * 100)}% crit`)
    if (item.bonusLootMult) parts.push(`x${item.bonusLootMult} loot`)
    return parts.join('  ') || item.rarity
  }

  isOpen() { return this._open }
}
