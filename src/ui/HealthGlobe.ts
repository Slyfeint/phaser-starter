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
    const innerR = R - 2

    this.gfx.clear()

    // Background circle
    this.gfx.fillStyle(0x1a0000, 1)
    this.gfx.fillCircle(cx, cy, R)

    // Health-colored full inner circle
    const color = pct > 0.5 ? 0xcc2222 : pct > 0.25 ? 0xff7700 : 0xff2200
    this.gfx.fillStyle(color, 1)
    this.gfx.fillCircle(cx, cy, innerR)

    // Draw the "empty" arc segment at the top using a proper circle chord
    if (pct < 1) {
      const fillLineRelY = innerR - 2 * innerR * pct
      const halfChord = Math.sqrt(Math.max(0, innerR * innerR - fillLineRelY * fillLineRelY))
      const startAngle = Math.atan2(fillLineRelY, -halfChord)
      const endAngle = Math.atan2(fillLineRelY, halfChord)
      this.gfx.fillStyle(0x1a0000, 1)
      this.gfx.beginPath()
      this.gfx.arc(cx, cy, innerR, startAngle, endAngle, true)
      this.gfx.closePath()
      this.gfx.fillPath()
    }

    // Gloss highlight (stays well inside the circle, no bleed)
    this.gfx.fillStyle(0xffffff, 0.12)
    this.gfx.fillCircle(cx - R / 3, cy - R / 3, R / 5)

    // Border ring
    this.gfx.lineStyle(2, 0x880000, 1)
    this.gfx.strokeCircle(cx, cy, R)

    this.label.setText(`${Math.ceil(hp)}`)
  }

  destroy() {
    this.gfx.destroy()
    this.label.destroy()
  }
}
