import Phaser from 'phaser'
import type { Player } from '../entities/Player'
import { HealthGlobe } from './HealthGlobe'

export class HUD {
  private scene: Phaser.Scene
  private hpFill: Phaser.GameObjects.Rectangle
  private hpText: Phaser.GameObjects.Text
  private lootLabel: Phaser.GameObjects.Text
  private w1Label: Phaser.GameObjects.Text
  private w2Label: Phaser.GameObjects.Text
  private cdFill: Phaser.GameObjects.Rectangle
  private globe: HealthGlobe
  private bossBarBg: Phaser.GameObjects.Rectangle
  private bossBarFill: Phaser.GameObjects.Rectangle
  private bossBarName: Phaser.GameObjects.Text
  private bossBarVisible = false
  private floorLabel: Phaser.GameObjects.Text

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

  update(player: Player, loot: number, atkCooldownPct: number) {
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
    this.globe.update(player.hp, effMax)
  }

  showDamageNumber(x: number, y: number, amount: number, crit = false) {
    const color = crit ? '#ffff00' : '#ffffff'
    const size  = crit ? '18px' : '14px'
    const txt = this.scene.add.text(x, y, `${Math.round(amount)}`, {
      fontSize: size, fontStyle: 'bold', color,
    }).setDepth(30).setOrigin(0.5)

    this.scene.tweens.add({
      targets: txt, y: y - 44, alpha: 0,
      duration: 900, ease: 'Cubic.Out',
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
