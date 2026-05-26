import Phaser from 'phaser'
import { SaveManager } from '../systems/SaveManager'
import { ITEMS } from '../systems/ItemDefs'
import type { ItemDef } from '../systems/ItemDefs'
import { RARITY_COLOR } from '../systems/Rarity'
import { getSellPrice } from '../ui/ShopUI'

type Tab = 'general' | 'alchemist' | 'collector'

const GEAR_PRICES: Record<string, number> = { common: 60, uncommon: 120, rare: 250 }
const ALCHEMIST_STOCK: { id: string; price: number }[] = [
  { id: 'bandage',        price: 30  },
  { id: 'greater_bandage',price: 60  },
  { id: 'whetstone',      price: 80  },
  { id: 'speed_potion',   price: 80  },
  { id: 'shield_flask',   price: 100 },
  { id: 'smoke_bomb',     price: 100 },
  { id: 'elixir',         price: 120 },
]

const META_UPGRADES: { id: string; label: string; effect: string; baseCost: number }[] = [
  { id: 'vitality',    label: 'Vitality',     effect: '+5 max HP / rank',        baseCost: 100 },
  { id: 'combat_edge', label: 'Combat Edge',  effect: '+2% weapon dmg / rank',   baseCost: 120 },
  { id: 'lucky_start', label: 'Lucky Start',  effect: '+30 starting gold / rank', baseCost: 80  },
  { id: 'iron_skin',   label: 'Iron Skin',    effect: '+1% armor / rank',         baseCost: 150 },
  { id: 'nimble',      label: 'Nimble',       effect: '+3 move speed / rank',     baseCost: 100 },
  { id: 'bag_space',   label: 'Bag Space',    effect: '+1 bag slot / rank',       baseCost: 200 },
]

const MAX_RANK = 5

export class MarketplaceScene extends Phaser.Scene {
  private activeTab: Tab = 'general'
  private generalStock: ItemDef[] = []
  private _objects: Phaser.GameObjects.GameObject[] = []

  constructor() { super('MarketplaceScene') }

  create() {
    this.activeTab = 'general'
    this.generalStock = this.rollGeneralStock()
    this.rebuild()
  }

  private rollGeneralStock(): ItemDef[] {
    const pool = ITEMS.filter(i =>
      i.slotType !== 'consumable' &&
      (i.rarity === 'common' || i.rarity === 'uncommon' || i.rarity === 'rare')
    )
    Phaser.Utils.Array.Shuffle(pool)
    return pool.slice(0, 6)
  }

  private rebuild() {
    this._objects.forEach(o => o.destroy())
    this._objects = []
    const save = SaveManager.load()
    const W = this.scale.width, H = this.scale.height
    const p = 10

    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => { this._objects.push(o); return o }

    // Background
    add(this.add.rectangle(0, 0, W, H, 0x000810).setOrigin(0))

    // Header
    add(this.add.text(W / 2, 10, 'MARKETPLACE', { fontSize: '20px', fontStyle: 'bold', color: '#ffcc00' }).setOrigin(0.5, 0))
    add(this.add.text(W - p, 12, `Gold: ${save.gold}g`, { fontSize: '13px', color: '#ffd700' }).setOrigin(1, 0))

    const backBtn = add(this.add.text(p, 12, '[ BACK ]', { fontSize: '12px', color: '#558866' }).setInteractive({ useHandCursor: true }))
    ;(backBtn as Phaser.GameObjects.Text).on('pointerover', () => (backBtn as Phaser.GameObjects.Text).setColor('#aaffcc'))
    ;(backBtn as Phaser.GameObjects.Text).on('pointerout',  () => (backBtn as Phaser.GameObjects.Text).setColor('#558866'))
    ;(backBtn as Phaser.GameObjects.Text).on('pointerdown', () => this.scene.start('LobbyScene'))

    // Tab bar
    const tabs: { key: Tab; label: string }[] = [
      { key: 'general',   label: 'GENERAL' },
      { key: 'alchemist', label: 'ALCHEMIST' },
      { key: 'collector', label: 'COLLECTOR' },
    ]
    const tabW = Math.floor((W - p * 2) / 3)
    tabs.forEach(({ key, label }, i) => {
      const tx = p + i * tabW
      const isActive = this.activeTab === key
      const bg = add(this.add.rectangle(tx, 38, tabW - 2, 22, isActive ? 0x112233 : 0x050f18).setOrigin(0).setStrokeStyle(1, isActive ? 0x00ffcc : 0x1a2a3a))
      const txt = add(this.add.text(tx + tabW / 2 - 1, 49, label, { fontSize: '10px', fontStyle: 'bold', color: isActive ? '#00ffcc' : '#445566' }).setOrigin(0.5))
      if (!isActive) {
        bg.setInteractive({ useHandCursor: true })
        ;(bg as Phaser.GameObjects.Rectangle).on('pointerover', () => { (bg as Phaser.GameObjects.Rectangle).setStrokeStyle(1, 0x334455); (txt as Phaser.GameObjects.Text).setColor('#88aaaa') })
        ;(bg as Phaser.GameObjects.Rectangle).on('pointerout',  () => { (bg as Phaser.GameObjects.Rectangle).setStrokeStyle(1, 0x1a2a3a); (txt as Phaser.GameObjects.Text).setColor('#445566') })
        ;(bg as Phaser.GameObjects.Rectangle).on('pointerdown', () => { this.activeTab = key; this.rebuild() })
      }
    })

    // Sell strip at bottom (always visible)
    const sellY = H - 110
    add(this.add.rectangle(p, sellY, W - p * 2, 100, 0x080f18).setOrigin(0).setStrokeStyle(1, 0x1a2a3a))
    add(this.add.text(W / 2, sellY + 4, 'SELL ITEMS (click to sell)', { fontSize: '9px', color: '#445566' }).setOrigin(0.5, 0))
    const bagItems = save.bag
    const slotW = 80, slotH = 55, slotGap = 4
    const totalSW = Math.min(bagItems.length, 5) * (slotW + slotGap) - slotGap
    const startSX = Math.floor((W - totalSW) / 2)
    bagItems.slice(0, 5).forEach((item, i) => {
      const sx = startSX + i * (slotW + slotGap)
      const sy = sellY + 18
      const sellPrice = getSellPrice(item)
      const slotBg = add(this.add.rectangle(sx, sy, slotW, slotH, 0x0a1520).setOrigin(0).setStrokeStyle(1, 0x1e2e3e).setInteractive({ useHandCursor: true }))
      add(this.add.text(sx + slotW / 2, sy + 10, item.name.split(' ').slice(0, 2).join('\n'), { fontSize: '8px', color: RARITY_COLOR[item.rarity] ?? '#aaaaaa', align: 'center', wordWrap: { width: slotW - 4 } }).setOrigin(0.5, 0))
      add(this.add.text(sx + slotW / 2, sy + slotH - 13, `${sellPrice}g`, { fontSize: '9px', color: '#ffd700' }).setOrigin(0.5, 0))
      ;(slotBg as Phaser.GameObjects.Rectangle).on('pointerover', () => (slotBg as Phaser.GameObjects.Rectangle).setFillStyle(0x162030))
      ;(slotBg as Phaser.GameObjects.Rectangle).on('pointerout',  () => (slotBg as Phaser.GameObjects.Rectangle).setFillStyle(0x0a1520))
      ;(slotBg as Phaser.GameObjects.Rectangle).on('pointerdown', () => {
        const fresh = SaveManager.load()
        fresh.bag.splice(i, 1)
        fresh.gold += sellPrice
        SaveManager.save(fresh)
        this.rebuild()
      })
    })
    if (bagItems.length === 0) {
      add(this.add.text(W / 2, sellY + 40, '(bag is empty)', { fontSize: '11px', color: '#334455' }).setOrigin(0.5, 0))
    }

    // Content area
    const contentY = 62
    const contentH = sellY - contentY - 6
    if (this.activeTab === 'general')   this.buildGeneral(add, save.gold, p, contentY, W, contentH)
    if (this.activeTab === 'alchemist') this.buildAlchemist(add, save.gold, p, contentY, W)
    if (this.activeTab === 'collector') this.buildCollector(add, save, p, contentY, W)
  }

  private buildGeneral(
    add: <T extends Phaser.GameObjects.GameObject>(o: T) => T,
    gold: number, p: number, contentY: number, W: number, _contentH: number
  ) {
    add(this.add.text(W / 2, contentY + 4, 'General Merchant  (max Rare quality)', { fontSize: '9px', color: '#445566' }).setOrigin(0.5, 0))
    this.generalStock.forEach((item, i) => {
      const ry = contentY + 20 + i * 38
      const price = GEAR_PRICES[item.rarity] ?? 60
      const canAfford = gold >= price
      const rowBg = add(this.add.rectangle(p, ry, W - p * 2 - 60, 34, 0x0a1520).setOrigin(0).setStrokeStyle(1, 0x1a2a3a))
      add(this.add.text(p + 6, ry + 8, item.name, { fontSize: '13px', fontStyle: 'bold', color: RARITY_COLOR[item.rarity] ?? '#aaaaaa' }))
      add(this.add.text(p + 6, ry + 22, `[${item.rarity}]  ${item.slotType}`, { fontSize: '8px', color: '#445566' }))
      const buyBtn = add(this.add.text(W - p - 4, ry + 10, `BUY ${price}g`, { fontSize: '11px', fontStyle: 'bold', color: canAfford ? '#00ffcc' : '#334455' }).setOrigin(1, 0).setInteractive({ useHandCursor: canAfford }))
      if (canAfford) {
        rowBg.setInteractive({ useHandCursor: true })
        ;(rowBg as Phaser.GameObjects.Rectangle).on('pointerover', () => (rowBg as Phaser.GameObjects.Rectangle).setFillStyle(0x112233))
        ;(rowBg as Phaser.GameObjects.Rectangle).on('pointerout',  () => (rowBg as Phaser.GameObjects.Rectangle).setFillStyle(0x0a1520))
        ;(buyBtn as Phaser.GameObjects.Text).on('pointerover', () => (buyBtn as Phaser.GameObjects.Text).setColor('#ffffff'))
        ;(buyBtn as Phaser.GameObjects.Text).on('pointerout',  () => (buyBtn as Phaser.GameObjects.Text).setColor('#00ffcc'))
        const doBuy = () => {
          const fresh = SaveManager.load()
          if (fresh.gold < price) return
          fresh.gold -= price
          fresh.bag.push(item)
          SaveManager.save(fresh)
          this.generalStock.splice(i, 1)
          this.rebuild()
        }
        ;(rowBg as Phaser.GameObjects.Rectangle).on('pointerdown', doBuy)
        ;(buyBtn as Phaser.GameObjects.Text).on('pointerdown', doBuy)
      }
    })

    // Restock button
    const rstY = contentY + 20 + this.generalStock.length * 38 + 8
    const fresh = SaveManager.load()
    const canRestock = fresh.gold >= 50
    const rstBtn = add(this.add.text(W / 2, rstY, `[ RESTOCK  50g ]`, { fontSize: '12px', fontStyle: 'bold', color: canRestock ? '#cc9900' : '#334455' }).setOrigin(0.5, 0))
    if (canRestock) {
      ;(rstBtn as Phaser.GameObjects.Text).setInteractive({ useHandCursor: true })
      ;(rstBtn as Phaser.GameObjects.Text).on('pointerover', () => (rstBtn as Phaser.GameObjects.Text).setColor('#ffcc00'))
      ;(rstBtn as Phaser.GameObjects.Text).on('pointerout',  () => (rstBtn as Phaser.GameObjects.Text).setColor('#cc9900'))
      ;(rstBtn as Phaser.GameObjects.Text).on('pointerdown', () => {
        const s = SaveManager.load()
        if (s.gold < 50) return
        s.gold -= 50
        SaveManager.save(s)
        this.generalStock = this.rollGeneralStock()
        this.rebuild()
      })
    }
  }

  private buildAlchemist(
    add: <T extends Phaser.GameObjects.GameObject>(o: T) => T,
    gold: number, p: number, contentY: number, W: number
  ) {
    add(this.add.text(W / 2, contentY + 4, 'Alchemist  (items go into your bag for next run)', { fontSize: '9px', color: '#445566' }).setOrigin(0.5, 0))
    ALCHEMIST_STOCK.forEach(({ id, price }, i) => {
      const item = ITEMS.find(it => it.id === id)
      if (!item) return
      const ry = contentY + 20 + i * 38
      const canAfford = gold >= price
      const rowBg = add(this.add.rectangle(p, ry, W - p * 2 - 60, 34, 0x0a1520).setOrigin(0).setStrokeStyle(1, 0x1a2a3a))
      add(this.add.text(p + 6, ry + 8,  item.name,    { fontSize: '13px', fontStyle: 'bold', color: RARITY_COLOR[item.rarity] ?? '#aaaaaa' }))
      add(this.add.text(p + 6, ry + 22, '[consumable]', { fontSize: '8px', color: '#445566' }))
      const buyBtn = add(this.add.text(W - p - 4, ry + 10, `BUY ${price}g`, { fontSize: '11px', fontStyle: 'bold', color: canAfford ? '#00ffcc' : '#334455' }).setOrigin(1, 0).setInteractive({ useHandCursor: canAfford }))
      if (canAfford) {
        rowBg.setInteractive({ useHandCursor: true })
        ;(rowBg as Phaser.GameObjects.Rectangle).on('pointerover', () => (rowBg as Phaser.GameObjects.Rectangle).setFillStyle(0x112233))
        ;(rowBg as Phaser.GameObjects.Rectangle).on('pointerout',  () => (rowBg as Phaser.GameObjects.Rectangle).setFillStyle(0x0a1520))
        ;(buyBtn as Phaser.GameObjects.Text).on('pointerover', () => (buyBtn as Phaser.GameObjects.Text).setColor('#ffffff'))
        ;(buyBtn as Phaser.GameObjects.Text).on('pointerout',  () => (buyBtn as Phaser.GameObjects.Text).setColor('#00ffcc'))
        const doBuy = () => {
          const fresh = SaveManager.load()
          if (fresh.gold < price) return
          const bagCells = fresh.bag.reduce((s, it) => s + it.bagSize, 0)
          if (bagCells + item.bagSize > 20) return
          fresh.gold -= price
          fresh.bag.push(item)
          SaveManager.save(fresh)
          this.rebuild()
        }
        ;(rowBg as Phaser.GameObjects.Rectangle).on('pointerdown', doBuy)
        ;(buyBtn as Phaser.GameObjects.Text).on('pointerdown', doBuy)
      }
    })
  }

  private buildCollector(
    add: <T extends Phaser.GameObjects.GameObject>(o: T) => T,
    save: ReturnType<typeof SaveManager.load>,
    p: number, contentY: number, W: number
  ) {
    add(this.add.text(W / 2, contentY + 4, 'Collector  (permanent meta-upgrades, max 5 ranks)', { fontSize: '9px', color: '#445566' }).setOrigin(0.5, 0))
    META_UPGRADES.forEach(({ id, label, effect, baseCost }, i) => {
      const ry = contentY + 20 + i * 42
      const rank = save.metaUpgrades?.[id] ?? 0
      const maxed = rank >= MAX_RANK
      const cost = maxed ? 0 : baseCost * Math.pow(2, rank)
      const canAfford = !maxed && save.gold >= cost

      add(this.add.rectangle(p, ry, W - p * 2 - 70, 38, 0x0a1520).setOrigin(0).setStrokeStyle(1, maxed ? 0x224422 : 0x1a2a3a))
      add(this.add.text(p + 6, ry + 6,  label,  { fontSize: '13px', fontStyle: 'bold', color: maxed ? '#44aa44' : '#aaaaaa' }))
      add(this.add.text(p + 6, ry + 22, effect, { fontSize: '8px', color: '#445566' }))

      // Rank pips
      for (let r = 0; r < MAX_RANK; r++) {
        const px2 = W - p - 70 + r * 12
        add(this.add.circle(px2, ry + 19, 4, r < rank ? 0x44cc44 : 0x1a2a3a))
      }

      if (maxed) {
        add(this.add.text(W - p - 4, ry + 12, 'MAX', { fontSize: '10px', color: '#44aa44' }).setOrigin(1, 0))
      } else {
        const buyBtn = add(this.add.text(W - p - 4, ry + 10, `${cost}g`, { fontSize: '11px', fontStyle: 'bold', color: canAfford ? '#ffcc00' : '#334455' }).setOrigin(1, 0))
        if (canAfford) {
          ;(buyBtn as Phaser.GameObjects.Text).setInteractive({ useHandCursor: true })
          ;(buyBtn as Phaser.GameObjects.Text).on('pointerover', () => (buyBtn as Phaser.GameObjects.Text).setColor('#ffffff'))
          ;(buyBtn as Phaser.GameObjects.Text).on('pointerout',  () => (buyBtn as Phaser.GameObjects.Text).setColor('#ffcc00'))
          ;(buyBtn as Phaser.GameObjects.Text).on('pointerdown', () => {
            const fresh = SaveManager.load()
            if (fresh.gold < cost) return
            fresh.gold -= cost
            fresh.metaUpgrades = fresh.metaUpgrades ?? {}
            fresh.metaUpgrades[id] = (fresh.metaUpgrades[id] ?? 0) + 1
            SaveManager.save(fresh)
            this.rebuild()
          })
        }
      }
    })
  }
}
