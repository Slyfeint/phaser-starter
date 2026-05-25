import Phaser from 'phaser'

export class HealthGlobe {
  private gfx: Phaser.GameObjects.Graphics
  private label: Phaser.GameObjects.Text
  readonly cx: number
  readonly cy: number
  private readonly R = 24

  constructor(scene: Phaser.Scene) {
    const { width, height } = scene.scale
    this.cx = width - 40
    this.cy = height - 40
    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(22)
    this.label = scene.add.text(this.cx, this.cy, '', {
      fontSize: '9px', color: '#ffbbbb', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(23)
  }

  update(hp: number, maxHp: number) {
    const pct = Math.max(0, Math.min(1, hp / maxHp))
    const { cx, cy, R } = this

    this.gfx.clear()

    this.gfx.fillStyle(0x1a0000, 1)
    this.gfx.fillCircle(cx, cy, R)

    const color = pct > 0.5 ? 0xcc2222 : pct > 0.25 ? 0xff7700 : 0xff2200
    this.gfx.fillStyle(color, 1)
    this.gfx.fillCircle(cx, cy, R - 2)

    const emptyH = Math.round((R - 2) * 2 * (1 - pct))
    if (emptyH > 0) {
      this.gfx.fillStyle(0x000000, 1)
      this.gfx.fillRect(cx - R + 2, cy - R + 2, (R - 2) * 2, emptyH)
    }

    this.gfx.fillStyle(0xffffff, 0.1)
    this.gfx.fillRect(cx - R + 5, cy - R + 5, 4, R - 6)

    this.gfx.lineStyle(2, 0x880000, 1)
    this.gfx.strokeCircle(cx, cy, R)

    this.label.setText(`${Math.ceil(hp)}`)
  }

  destroy() {
    this.gfx.destroy()
    this.label.destroy()
  }
}
