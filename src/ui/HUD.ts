import Phaser from 'phaser'

export class HUD {
  private hpFill: Phaser.GameObjects.Rectangle
  private lootLabel: Phaser.GameObjects.Text
  private hint: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    const p = 14

    scene.add
      .rectangle(p + 80, p + 8, 160, 12, 0x440000)
      .setScrollFactor(0).setDepth(20)

    this.hpFill = scene.add
      .rectangle(p, p + 8, 160, 8, 0xee2222)
      .setScrollFactor(0).setDepth(21).setOrigin(0, 0.5)

    scene.add
      .text(p, p + 16, 'HP', { fontSize: '10px', color: '#ff8888' })
      .setScrollFactor(0).setDepth(21)

    this.lootLabel = scene.add
      .text(p, p + 28, 'Loot: 0', { fontSize: '14px', color: '#ffd700' })
      .setScrollFactor(0).setDepth(21)

    this.hint = scene.add
      .text(scene.scale.width / 2, scene.scale.height - 20,
        'WASD / ←→↑↓  Move    SPACE / Tap right  Attack',
        { fontSize: '10px', color: '#555566' })
      .setScrollFactor(0).setDepth(21).setOrigin(0.5)
  }

  update(hpPercent: number, loot: number) {
    this.hpFill.width = Math.max(0, 160 * hpPercent)
    this.lootLabel.setText(`Loot: ${loot}`)
  }

  hideHint() {
    this.hint.setVisible(false)
  }
}
