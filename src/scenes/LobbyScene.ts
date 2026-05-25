import Phaser from 'phaser'
import { SaveManager } from '../systems/SaveManager'
import { COSMETICS } from '../systems/Cosmetics'
import { SLOT_ORDER } from '../systems/Inventory'
import type { EquipSlot } from '../systems/ItemDefs'
import { RARITY_COLOR } from '../systems/Rarity'

const THEMES = ['dungeon', 'castle', 'caves'] as const
type Theme = typeof THEMES[number]

const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon1: 'WPN 1', weapon2: 'WPN 2',
  helm: 'HELM', chest: 'CHEST', legs: 'LEGS',
  gloves: 'GLOVES', ring: 'RING', necklace: 'NECK',
}

export class LobbyScene extends Phaser.Scene {
  constructor() { super('LobbyScene') }

  create() {
    const save = SaveManager.load()
    const { width, height } = this.scale

    // ── Background ─────────────────────────────────────────
    this.add.rectangle(0, 0, width, height, 0x000810).setOrigin(0)

    // Title
    this.add.text(width / 2, 18, 'DUNGEON DESCENT', { fontSize: '22px', fontStyle: 'bold', color: '#00ffcc' })
      .setOrigin(0.5, 0)
    this.add.text(width / 2, 42, 'Character Select', { fontSize: '11px', color: '#334455' })
      .setOrigin(0.5, 0)

    // Gold display
    this.add.text(width - 12, 18, `Gold: ${save.gold}`, { fontSize: '12px', color: '#ffd700' })
      .setOrigin(1, 0)

    const p = 12

    // ── Left panel: character preview + stats ───────────────
    this.add.rectangle(p, 60, 110, 180, 0x0a1520).setOrigin(0)
    this.add.text(p + 55, 65, 'CHARACTER', { fontSize: '8px', color: '#334455' }).setOrigin(0.5, 0)

    // Player sprite preview
    const previewSprite = this.add.sprite(p + 55, 118, 'player').setScale(2)
    const cosmetic = COSMETICS.find(c => c.id === save.activeCosmetic) ?? COSMETICS[0]
    if (cosmetic.tint !== 0xffffff) previewSprite.setTint(cosmetic.tint)

    // Stats
    const statY = 152
    this.add.text(p + 4, statY,     `Runs:   ${save.stats.runsCompleted}`, { fontSize: '9px', color: '#445566' })
    this.add.text(p + 4, statY + 12, `Gold:   ${save.stats.totalGold}`,    { fontSize: '9px', color: '#445566' })
    this.add.text(p + 4, statY + 24, `Bosses: ${Object.values(save.progress).filter(p2 => p2.bossDefeated).length}/3`, { fontSize: '9px', color: '#445566' })

    // Settings button
    const settingsBtn = this.add.text(p + 4, 230, '[ SETTINGS ]', { fontSize: '9px', color: '#334455' })
      .setInteractive({ useHandCursor: true })
    settingsBtn.on('pointerover', () => settingsBtn.setColor('#aaaaaa'))
    settingsBtn.on('pointerout',  () => settingsBtn.setColor('#334455'))
    settingsBtn.on('pointerdown', () => this.scene.start('Settings'))

    // ── Center panel: equipped gear ─────────────────────────
    const gx = p + 118
    this.add.rectangle(gx, 60, 130, 220, 0x0a1520).setOrigin(0)
    this.add.text(gx + 65, 65, 'EQUIPPED', { fontSize: '8px', color: '#334455' }).setOrigin(0.5, 0)

    SLOT_ORDER.forEach((slot, i) => {
      const sy = 78 + i * 24
      this.add.text(gx + 4, sy, SLOT_LABELS[slot as EquipSlot], { fontSize: '7px', color: '#2a3a4a' })
      const item = save.equippedGear[slot as EquipSlot]
      let str = '--'
      let color = '#334455'
      if (item) {
        str = item.name.length > 14 ? item.name.substring(0, 13) + '…' : item.name
        color = RARITY_COLOR[item.rarity] ?? '#aaaaaa'
      }
      this.add.text(gx + 4, sy + 9, str, { fontSize: '9px', color })
    })

    // ── Right panel: bag ────────────────────────────────────
    const bx = gx + 138
    const bw = width - bx - p
    this.add.rectangle(bx, 60, bw, 220, 0x0a1520).setOrigin(0)
    this.add.text(bx + bw / 2, 65, 'BAG', { fontSize: '8px', color: '#334455' }).setOrigin(0.5, 0)

    if (save.bag.length === 0) {
      this.add.text(bx + 4, 84, '(empty)', { fontSize: '9px', color: '#2a3a4a' })
    } else {
      save.bag.slice(0, 10).forEach((item, i) => {
        const iy = 78 + i * 22
        const color = RARITY_COLOR[item.rarity] ?? '#aaaaaa'
        const nm = item.name.length > 12 ? item.name.substring(0, 11) + '…' : item.name
        this.add.text(bx + 4, iy, nm, { fontSize: '9px', color })
        this.add.text(bx + 4, iy + 10, `[${item.bagSize}] ${item.rarity}`, { fontSize: '7px', color: '#2a3a4a' })
      })
      if (save.bag.length > 10) {
        this.add.text(bx + 4, 78 + 10 * 22, `+${save.bag.length - 10} more...`, { fontSize: '8px', color: '#2a3a4a' })
      }
    }

    // ── Cosmetics row ───────────────────────────────────────
    const cosY = 290
    this.add.text(p, cosY, 'COSMETICS', { fontSize: '8px', color: '#334455' })

    COSMETICS.forEach((cos, i) => {
      const cx = p + i * 52
      const cy = cosY + 14
      const unlocked = save.unlockedCosmetics.includes(cos.id)
      const isActive = save.activeCosmetic === cos.id

      const box = this.add.rectangle(cx, cy, 46, 28, isActive ? 0x003322 : 0x0a1520)
        .setOrigin(0).setStrokeStyle(1, isActive ? 0x00ffcc : 0x222222)
      const dot = this.add.circle(cx + 12, cy + 14, 7, unlocked ? cos.tint : 0x222222)

      const label = this.add.text(cx + 22, cy + 6, cos.name, { fontSize: '7px', color: unlocked ? '#aaaaaa' : '#333333' })

      let priceLabel: Phaser.GameObjects.Text | null = null
      if (!unlocked && !cos.fromBoss) {
        priceLabel = this.add.text(cx + 22, cy + 16, `${cos.price}g`, { fontSize: '7px', color: '#ffd700' })
      } else if (!unlocked && cos.fromBoss) {
        this.add.text(cx + 22, cy + 16, 'Boss drop', { fontSize: '6px', color: '#884400' })
      }

      if (unlocked || (!cos.fromBoss && save.gold >= cos.price)) {
        ;[box, dot, label, priceLabel].forEach(obj => {
          if (!obj) return
          obj.setInteractive({ useHandCursor: true })
          obj.on('pointerdown', () => {
            if (!unlocked) {
              if (save.gold < cos.price) return
              save.gold -= cos.price
              save.unlockedCosmetics.push(cos.id)
            }
            save.activeCosmetic = cos.id
            SaveManager.save(save)
            this.scene.restart()
          })
        })
      }
    })

    // ── Dungeon selection ───────────────────────────────────
    const themeY = 336
    this.add.text(width / 2, themeY, 'SELECT DUNGEON', { fontSize: '9px', color: '#334455' }).setOrigin(0.5, 0)

    let activeTheme: Theme = (this.registry.get('mapTheme') as Theme) ?? 'dungeon'
    const themeBtns: Phaser.GameObjects.Rectangle[] = []

    THEMES.forEach((theme, i) => {
      const tx = p + i * (width - p * 2) / 3
      const tw = (width - p * 2) / 3 - 6
      const prog = save.progress[theme]
      const isActive = activeTheme === theme

      const bg = this.add.rectangle(tx, themeY + 14, tw, 56, isActive ? 0x002233 : 0x0a1520)
        .setOrigin(0).setStrokeStyle(1, isActive ? 0x00ffcc : 0x222233)
      themeBtns.push(bg)

      const label = theme.charAt(0).toUpperCase() + theme.slice(1)
      this.add.text(tx + tw / 2, themeY + 20, label, { fontSize: '11px', color: isActive ? '#00ffcc' : '#445566' })
        .setOrigin(0.5, 0)
      this.add.text(tx + tw / 2, themeY + 36, `Floor ${prog.highestFloor}/3`, { fontSize: '8px', color: '#334455' })
        .setOrigin(0.5, 0)
      if (prog.bossDefeated) {
        this.add.text(tx + tw / 2, themeY + 48, '★ Cleared', { fontSize: '7px', color: '#ffd700' })
          .setOrigin(0.5, 0)
      }

      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => {
        activeTheme = theme
        this.registry.set('mapTheme', theme)
        this.scene.restart()
      })
    })

    // ── Start Run button ────────────────────────────────────
    const startY = height - 60
    const startBtn = this.add.text(width / 2, startY, '[ START RUN ]', {
      fontSize: '24px', fontStyle: 'bold', color: '#00ffcc',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    startBtn.on('pointerover', () => startBtn.setColor('#ffffff'))
    startBtn.on('pointerout',  () => startBtn.setColor('#00ffcc'))
    startBtn.on('pointerdown', () => {
      this.registry.set('currentFloor', 1)
      this.registry.remove('runState')
      this.scene.start('DungeonScene')
    })

    this.add.text(width / 2, height - 12, 'Gear from successful runs is kept. Death loses bag items.',
      { fontSize: '7px', color: '#1a2a1a' }).setOrigin(0.5)
  }
}
