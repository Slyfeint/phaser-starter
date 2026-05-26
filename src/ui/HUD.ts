import Phaser from 'phaser'
import type { Player } from '../entities/Player'
import type { ItemDef } from '../systems/ItemDefs'
import { HealthGlobe } from './HealthGlobe'

export class HUD {
  private scene: Phaser.Scene
  private hpFill: Phaser.GameObjects.Rectangle
  private hpText: Phaser.GameObjects.Text
  private lootLabel: Phaser.GameObjects.Text
  private w1Label: Phaser.GameObjects.Text
  private w2Label: Phaser.GameObjects.Text
  private cdFill: Phaser.GameObjects.Rectangle
  private rollCdFill: Phaser.GameObjects.Rectangle
  private globe: HealthGlobe
  private bossBarBg: Phaser.GameObjects.Rectangle
  private bossBarFill: Phaser.GameObjects.Rectangle
  private bossBarName: Phaser.GameObjects.Text
  private bossBarVisible = false
  private floorLabel: Phaser.GameObjects.Text
  private hotbarSlots: Phaser.GameObjects.Rectangle[] = []
  private hotbarNames: Phaser.GameObjects.Text[] = []
  private hotbarCounts: Phaser.GameObjects.Text[] = []
  private abilityBarE!: Phaser.GameObjects.Graphics
  private abilityBarR!: Phaser.GameObjects.Graphics
  private abilityLabelE!: Phaser.GameObjects.Text
  private abilityLabelR!: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const p = 14
    const { width, height } = scene.scale

    // HP bar (top left)
    scene.add.rectangle(p + 80, p + 10, 160, 18, 0x220000).setScrollFactor(0).setDepth(20)
    this.hpFill = scene.add.rectangle(p, p + 10, 160, 16, 0x44ee44)
      .setScrollFactor(0).setDepth(21).setOrigin(0, 0.5)
    scene.add.text(p + 2, p + 3, 'HP', { fontSize: '11px', fontStyle: 'bold', color: '#ffaaaa' })
      .setScrollFactor(0).setDepth(23)
    this.hpText = scene.add.text(p + 165, p + 3, '', { fontSize: '10px', color: '#ffcccc' })
      .setScrollFactor(0).setDepth(23).setOrigin(1, 0)

    // Gold / loot
    this.lootLabel = scene.add.text(p, p + 28, 'Gold: 0', { fontSize: '13px', color: '#ffd700' })
      .setScrollFactor(0).setDepth(21)

    // Weapon slots (bottom left)
    const by = height - 64
    scene.add.text(p, by - 14, 'WEAPONS', { fontSize: '9px', color: '#334455' })
      .setScrollFactor(0).setDepth(21)
    this.w1Label = scene.add.text(p, by, '[1] --', { fontSize: '12px', color: '#00ffcc' })
      .setScrollFactor(0).setDepth(21)
    this.w2Label = scene.add.text(p, by + 16, '[2] --', { fontSize: '12px', color: '#445566' })
      .setScrollFactor(0).setDepth(21)
    scene.add.rectangle(p, by + 34, 100, 4, 0x223333)
      .setScrollFactor(0).setDepth(20).setOrigin(0, 0.5)
    this.cdFill = scene.add.rectangle(p, by + 34, 0, 4, 0x00ffcc)
      .setScrollFactor(0).setDepth(21).setOrigin(0, 0.5)
    scene.add.text(p, by + 42, 'ATK', { fontSize: '6px', color: '#223333' })
      .setScrollFactor(0).setDepth(21)
    scene.add.rectangle(p, by + 50, 100, 4, 0x332200)
      .setScrollFactor(0).setDepth(20).setOrigin(0, 0.5)
    this.rollCdFill = scene.add.rectangle(p, by + 50, 100, 4, 0xcc8800)
      .setScrollFactor(0).setDepth(21).setOrigin(0, 0.5)
    scene.add.text(p, by + 56, 'ROLL', { fontSize: '6px', color: '#332200' })
      .setScrollFactor(0).setDepth(21)

    // Hint (bottom center)
    scene.add.text(
      width / 2, height - 8,
      'WASD Move  SPACE Attack  Q Roll  F Swap  I Inventory  TAB Shop  E Door',
      { fontSize: '7px', color: '#2a3a4a' },
    ).setScrollFactor(0).setDepth(21).setOrigin(0.5)

    // Boss bar (top center, hidden by default)
    const bbw = 220
    this.bossBarBg = scene.add.rectangle(width / 2, 14, bbw, 12, 0x220000)
      .setScrollFactor(0).setDepth(21).setVisible(false)
    this.bossBarFill = scene.add.rectangle(width / 2 - bbw / 2, 14, bbw, 8, 0xcc0000)
      .setScrollFactor(0).setDepth(22).setOrigin(0, 0.5).setVisible(false)
    this.bossBarName = scene.add.text(width / 2, 14, '', { fontSize: '8px', color: '#ff8888' })
      .setScrollFactor(0).setDepth(23).setOrigin(0.5).setVisible(false)

    // Floor / theme label (top right)
    this.floorLabel = scene.add.text(width - p, p, 'Dungeon F1', { fontSize: '10px', color: '#445566' })
      .setScrollFactor(0).setDepth(21).setOrigin(1, 0)

    // Consumable hotbar (bottom center)
    const slotW = 48, slotH = 30, slotGap = 5
    const totalHW = 3 * slotW + 2 * slotGap
    const hx0 = Math.floor(width / 2 - totalHW / 2)
    const hy = height - 46
    scene.add.text(width / 2, hy - 10, 'ITEMS  ( 1 · 2 · 3 )', { fontSize: '7px', color: '#2a3a4a' })
      .setScrollFactor(0).setDepth(21).setOrigin(0.5)
    for (let i = 0; i < 3; i++) {
      const sx = hx0 + i * (slotW + slotGap)
      const bg = scene.add.rectangle(sx, hy, slotW, slotH, 0x08121c)
        .setScrollFactor(0).setDepth(20).setOrigin(0).setStrokeStyle(1, 0x1e2e3e)
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => scene.events.emit('hotbar-use', i))
      scene.add.text(sx + 3, hy + 2, `${i + 1}`, { fontSize: '7px', color: '#1a2a3a' })
        .setScrollFactor(0).setDepth(22)
      const name = scene.add.text(sx + slotW / 2, hy + slotH / 2 + 1, '',
        { fontSize: '7px', color: '#6699bb', align: 'center', wordWrap: { width: slotW - 6 } })
        .setScrollFactor(0).setDepth(22).setOrigin(0.5)
      const cnt = scene.add.text(sx + slotW - 3, hy + 2, '',
        { fontSize: '7px', color: '#336688' })
        .setScrollFactor(0).setDepth(22).setOrigin(1, 0)
      this.hotbarSlots.push(bg)
      this.hotbarNames.push(name)
      this.hotbarCounts.push(cnt)
    }

    // Ability bar (bottom right, above globe area)
    const abx = width - p - 108
    const aby = height - 64
    this.abilityBarE = scene.add.graphics().setScrollFactor(0).setDepth(22)
    this.abilityBarR = scene.add.graphics().setScrollFactor(0).setDepth(22)
    this.abilityLabelE = scene.add.text(abx, aby - 14, '[E]', { fontSize: '8px', color: '#445566' })
      .setScrollFactor(0).setDepth(22)
    this.abilityLabelR = scene.add.text(abx + 54, aby - 14, '[R]', { fontSize: '8px', color: '#445566' })
      .setScrollFactor(0).setDepth(22)
    // Store positions for update
    scene.data.set('_abilityBarPos', { ex: abx, ey: aby, rx: abx + 54, ry: aby })
    this.abilityBarE.setVisible(false)
    this.abilityBarR.setVisible(false)
    this.abilityLabelE.setVisible(false)
    this.abilityLabelR.setVisible(false)

    // Health globe (bottom right)
    this.globe = new HealthGlobe(scene)
  }

  setFloor(floor: number, theme: string) {
    const names: Record<string, string> = { dungeon: 'Dungeon', castle: 'Castle', caves: 'Caves' }
    this.floorLabel.setText(`${names[theme] ?? theme} F${floor}`)
  }

  showBossBar(bossName: string) {
    this.bossBarVisible = true
    this.bossBarName.setText(bossName).setVisible(true)
    this.bossBarBg.setVisible(true)
    this.bossBarFill.setVisible(true)
    const bbw = 220
    this.bossBarFill.width = bbw
  }

  updateBossBar(pct: number) {
    if (!this.bossBarVisible) return
    this.bossBarFill.width = Math.max(0, 220 * Math.max(0, pct))
  }

  hideBossBar() {
    this.bossBarVisible = false
    this.bossBarBg.setVisible(false)
    this.bossBarFill.setVisible(false)
    this.bossBarName.setVisible(false)
  }

  update(player: Player, loot: number, atkCooldownPct: number, rollCooldownPct = 0) {
    const effMax = player.effectiveMaxHp
    const hpPct = player.hp / effMax
    this.hpFill.width = Math.max(0, 160 * hpPct)
    this.hpFill.fillColor = hpPct > 0.5 ? 0x44ee44 : hpPct > 0.25 ? 0xeecc00 : 0xee2222
    this.hpText.setText(`${player.hp}/${effMax}`)
    this.lootLabel.setText(`Gold: ${loot}`)

    const stats = player.inventory.getStats()
    this.w1Label.setText(`[1] ${stats.weapon1?.name ?? '--'}`)
    this.w2Label.setText(`[2] ${stats.weapon2?.name ?? '--'}`)
    this.w1Label.setColor(player.activeSlot === 0 ? '#00ffcc' : '#445566')
    this.w2Label.setColor(player.activeSlot === 1 ? '#00ffcc' : '#445566')

    this.cdFill.width = 100 * (1 - atkCooldownPct)
    this.rollCdFill.width = 100 * (1 - rollCooldownPct)
    this.globe.update(player.hp, effMax)

    // Ability cooldown bars
    if (player.activeClass) {
      this.abilityBarE.setVisible(true)
      this.abilityBarR.setVisible(true)
      this.abilityLabelE.setVisible(true)
      this.abilityLabelR.setVisible(true)
      const pos = this.scene.data.get('_abilityBarPos') as { ex: number; ey: number; rx: number; ry: number }
      if (pos) {
        const pctE = player.abilityCdEMax > 0 ? 1 - (player.abilityCdE / player.abilityCdEMax) : 1
        const pctR = player.abilityCdRMax > 0 ? 1 - (player.abilityCdR / player.abilityCdRMax) : 1
        const barW = 48
        this.abilityBarE.clear()
        this.abilityBarE.fillStyle(0x220033, 0.8)
        this.abilityBarE.fillRect(pos.ex, pos.ey, barW, 6)
        this.abilityBarE.fillStyle(0xaa44ff, 1)
        this.abilityBarE.fillRect(pos.ex, pos.ey, Math.round(barW * pctE), 6)
        this.abilityBarR.clear()
        this.abilityBarR.fillStyle(0x220033, 0.8)
        this.abilityBarR.fillRect(pos.rx, pos.ry, barW, 6)
        this.abilityBarR.fillStyle(0xaa44ff, 1)
        this.abilityBarR.fillRect(pos.rx, pos.ry, Math.round(barW * pctR), 6)
        // Aiming shot charge indicator for Ranger
        if (player.isAimingShot) {
          this.abilityBarE.fillStyle(0xffff44, 1)
          this.abilityBarE.fillRect(pos.ex, pos.ey - 8, Math.round(barW * player.aimCharge), 4)
        }
      }
    } else {
      this.abilityBarE.setVisible(false)
      this.abilityBarR.setVisible(false)
      this.abilityLabelE.setVisible(false)
      this.abilityLabelR.setVisible(false)
    }
  }

  updateHotbar(items: ItemDef[]) {
    for (let i = 0; i < 3; i++) {
      const item = items[i]
      this.hotbarSlots[i].setFillStyle(item ? 0x0a2030 : 0x08121c)
      this.hotbarSlots[i].setStrokeStyle(1, item ? 0x336688 : 0x1e2e3e)
      this.hotbarNames[i].setText(item ? item.name.replace(' of ', '\n').split(' ').slice(0, 2).join(' ') : '')
      this.hotbarCounts[i].setText('')
    }
    // Count duplicates and show stack counts
    const nameCount = new Map<string, number>()
    for (const item of items) {
      if (item) nameCount.set(item.id, (nameCount.get(item.id) ?? 0) + 1)
    }
    for (let i = 0; i < 3; i++) {
      const item = items[i]
      if (item && (nameCount.get(item.id) ?? 0) > 1) {
        this.hotbarCounts[i].setText(`×${nameCount.get(item.id)}`)
      }
    }
  }

  showDamageNumber(x: number, y: number, amount: number, crit = false) {
    const rounded = Math.round(amount)
    const base = rounded < 20 ? 14 : rounded < 50 ? 18 : 24
    const px = (crit ? base + 4 : base) + 'px'
    const color = crit ? '#ffff00' : rounded >= 50 ? '#ff8844' : '#ffffff'
    const txt = this.scene.add.text(x, y, `${rounded}`, {
      fontSize: px, fontStyle: 'bold', color,
    }).setDepth(30).setOrigin(0.5)

    this.scene.tweens.add({
      targets: txt, y: y - 44, alpha: 0,
      duration: 900, ease: 'Cubic.Out',
      onComplete: () => txt.destroy(),
    })
  }

  showStreakText(x: number, y: number, count: number) {
    const txt = this.scene.add.text(x, y, `x${count} STREAK!`, {
      fontSize: '16px', fontStyle: 'bold', color: '#ff8800',
      stroke: '#441100', strokeThickness: 3,
    }).setDepth(30).setOrigin(0.5).setScrollFactor(0)
    this.scene.tweens.add({
      targets: txt, y: y - 40, alpha: 0, scaleX: 1.3, scaleY: 1.3,
      duration: 1200, ease: 'Cubic.Out',
      onComplete: () => txt.destroy(),
    })
  }

  showPickupText(x: number, y: number, text: string) {
    const txt = this.scene.add.text(x, y, text, { fontSize: '11px', color: '#ffd700' })
      .setDepth(30).setOrigin(0.5)
    this.scene.tweens.add({
      targets: txt, y: y - 30, alpha: 0,
      duration: 1400, ease: 'Cubic.Out',
      onComplete: () => txt.destroy(),
    })
  }
}
