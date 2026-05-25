import Phaser from 'phaser'
import { ITEMS } from '../systems/ItemDefs'
import type { ItemDef } from '../systems/ItemDefs'
import { RARITY_COLOR } from '../systems/Rarity'

const GEAR_PRICES: Record<string, number> = {
  common: 60, uncommon: 120, rare: 250, epic: 600, legendary: 1500,
}
const CONSUMABLE_PRICES: Record<string, number> = {
  bandage: 30, greater_bandage: 60, elixir: 120,
}

export class ShopUI {
  private scene: Phaser.Scene
  private objects: Phaser.GameObjects.GameObject[] = []
  private _open = false
  private shopItems: ItemDef[]
  private goldLabel?: Phaser.GameObjects.Text
  private currentGoldGetter?: () => number
  private currentOnBuy?: (item: ItemDef, price: number) => boolean

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

  open(getGold: () => number, onBuy: (item: ItemDef, price: number) => boolean) {
    if (this._open) return
    this._open = true
    this.currentGoldGetter = getGold
    this.currentOnBuy = onBuy
    this.buildUI()
  }

  close() {
    this._open = false
    this.objects.forEach(o => o.destroy())
    this.objects = []
    this.goldLabel = undefined
    this.currentGoldGetter = undefined
    this.currentOnBuy = undefined
  }

  private buildUI() {
    const scene = this.scene
    const { width, height } = scene.scale
    const pw = 320, ph = 310
    const px = (width - pw) / 2
    const py = (height - ph) / 2

    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.objects.push(o)
      return o
    }

    add(scene.add.rectangle(px, py, pw, ph, 0x000000, 0.93).setOrigin(0).setScrollFactor(0).setDepth(50))
    add(scene.add.rectangle(px + 1, py + 1, pw - 2, ph - 2, 0, 0)
      .setOrigin(0).setScrollFactor(0).setDepth(50).setStrokeStyle(1, 0xffd700, 0.5))
    add(scene.add.text(px + pw / 2, py + 8, 'SHOP  [E] close', { fontSize: '12px', color: '#ffd700' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(51))

    this.goldLabel = add(scene.add.text(px + pw / 2, py + 24, `Gold: ${this.currentGoldGetter?.() ?? 0}`,
      { fontSize: '10px', color: '#ffdd88' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51)) as Phaser.GameObjects.Text

    const bought = new Set<number>()

    this.shopItems.forEach((item, i) => {
      const sy = py + 46 + i * 50
      const price = item.slotType === 'consumable'
        ? (CONSUMABLE_PRICES[item.id] ?? 40)
        : (GEAR_PRICES[item.rarity] ?? 100)
      const color = RARITY_COLOR[item.rarity] ?? '#aaaaaa'

      add(scene.add.text(px + 12, sy, item.name, { fontSize: '11px', color }).setScrollFactor(0).setDepth(51))
      add(scene.add.text(px + 12, sy + 14, this.desc(item), { fontSize: '8px', color: '#556677' }).setScrollFactor(0).setDepth(51))

      const buyBtn = add(scene.add.text(px + pw - 65, sy + 6, `[${price}g]`,
        { fontSize: '11px', color: bought.has(i) ? '#556677' : '#ffd700' })
        .setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Text

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
  }

  private desc(item: ItemDef): string {
    if (item.slotType === 'consumable') return `Heal +${item.healAmount} HP`
    if (item.slotType === 'weapon') return `${item.rarity} ${item.weaponType ?? ''}`
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
