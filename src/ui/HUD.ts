import Phaser from 'phaser'
import type { Player } from '../entities/Player'

export class HUD {
  private scene: Phaser.Scene
  private hpFill: Phaser.GameObjects.Rectangle
  private hpText: Phaser.GameObjects.Text
  private lootLabel: Phaser.GameObjects.Text
  private w1Label: Phaser.GameObjects.Text
  private w2Label: Phaser.GameObjects.Text
  private cdFill: Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const p = 14

    scene.add.rectangle(p + 80, p + 7, 160, 10, 0x440000)
      .setScrollFactor(0).setDepth(20)
    this.hpFill = scene.add.rectangle(p, p + 7, 160, 6, 0xee2222)
      .setScrollFactor(0).setDepth(21).setOrigin(0, 0.5)
    scene.add.text(p, p + 1, 'HP', { fontSize: '9px', color: '#ff8888' })
      .setScrollFactor(0).setDepth(22)
    this.hpText = scene.add.text(p + 166, p + 1, '', { fontSize: '9px', color: '#ff8888' })
      .setScrollFactor(0).setDepth(22)

    this.lootLabel = scene.add.text(p, p + 22, 'Loot: 0', { fontSize: '13px', color: '#ffd700' })
      .setScrollFactor(0).setDepth(21)

    const by = scene.scale.height - 64
    scene.add.text(p, by - 14, 'WEAPONS', { fontSize: '9px', color: '#334455' })
      .setScrollFactor(0).setDepth(21)
    this.w1Label = scene.add.text(p, by, '[1] --', { fontSize: '12px', color: '#00ffcc' })
      .setScrollFactor(0).setDepth(21)
    this.w2Label = scene.add.text(p, by + 16, '[2] --', { fontSize: '12px', color: '#445566' })
      .setScrollFactor(0).setDepth(21)

    // Cooldown bar (100px wide)
    scene.add.rectangle(p, by + 34, 100, 4, 0x223333)
      .setScrollFactor(0).setDepth(20).setOrigin(0, 0.5)
    this.cdFill = scene.add.rectangle(p, by + 34, 0, 4, 0x00ffcc)
      .setScrollFactor(0).setDepth(21).setOrigin(0, 0.5)

    scene.add.text(
      scene.scale.width / 2, scene.scale.height - 10,
      'WASD Move  SPACE/Tap Attack  Q Roll  F Swap  I Inventory',
      { fontSize: '8px', color: '#2a3a4a' }
    ).setScrollFactor(0).setDepth(21).setOrigin(0.5)
  }

  update(player: Player, loot: number, atkCooldownPct: number) {
    const effMax = player.effectiveMaxHp
    this.hpFill.width = Math.max(0, 160 * (player.hp / effMax))
    this.hpText.setText(`${player.hp}/${effMax}`)
    this.lootLabel.setText(`Loot: ${loot}`)

    const stats = player.inventory.getStats()
    this.w1Label.setText(`[1] ${stats.weapon1?.name ?? '--'}`)
    this.w2Label.setText(`[2] ${stats.weapon2?.name ?? '--'}`)
    this.w1Label.setColor(player.activeSlot === 0 ? '#00ffcc' : '#445566')
    this.w2Label.setColor(player.activeSlot === 1 ? '#00ffcc' : '#445566')

    this.cdFill.width = 100 * (1 - atkCooldownPct)
  }

  showDamageNumber(x: number, y: number, amount: number, crit = false) {
    const color = crit ? '#ffff00' : '#ffffff'
    const size = crit ? '18px' : '14px'
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
