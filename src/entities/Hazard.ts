import Phaser from 'phaser'
import type { Player } from './Player'

export type HazardType = 'fire_pit' | 'spike_trap' | 'dart_turret'

export class Hazard extends Phaser.GameObjects.Sprite {
  readonly hazardType: HazardType
  private timer = 0
  private fireDmgTimer = 0
  private burstDone = false
  private readonly dartDir: number

  constructor(scene: Phaser.Scene, x: number, y: number, type: HazardType) {
    const TEX: Record<HazardType, string> = { fire_pit:'hazard_fire', spike_trap:'hazard_spike', dart_turret:'hazard_dart' }
    super(scene, x, y, TEX[type])
    this.hazardType = type
    this.dartDir = Math.random() * Math.PI * 2
    scene.add.existing(this)
    this.setDepth(2)

    if (type === 'fire_pit') {
      this.setTint(0xff6600)
      scene.tweens.add({ targets: this, alpha: 0.55, duration: 350, yoyo: true, repeat: -1 })
    } else if (type === 'dart_turret') {
      this.setRotation(this.dartDir)
      this.setTint(0xaaaaaa)
    }
  }

  update(delta: number, player: Player) {
    this.timer += delta
    switch (this.hazardType) {
      case 'fire_pit':   this.updateFire(delta, player); break
      case 'spike_trap': this.updateSpike(player); break
      case 'dart_turret':this.updateDart(player); break
    }
  }

  private updateFire(delta: number, player: Player) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    if (dist < 20) {
      this.fireDmgTimer -= delta
      if (this.fireDmgTimer <= 0) {
        this.fireDmgTimer = 500
        player.takeDamage(5)
      }
    } else {
      this.fireDmgTimer = 0
    }
  }

  private updateSpike(player: Player) {
    // 2000ms off → 300ms warning → 600ms on → repeat
    const cycle = this.timer % 2900
    if (cycle < 2000) {
      this.setAlpha(0.85).clearTint()
      this.burstDone = false
    } else if (cycle < 2300) {
      // Warning flash
      this.setAlpha(cycle % 180 < 90 ? 1 : 0.3).setTint(0xffff00)
    } else {
      // Active - spike extended
      this.setAlpha(1).setTint(0xff4444)
      if (!this.burstDone) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
        if (dist < 24) {
          player.takeDamage(20)
          this.burstDone = true
        }
      }
    }
  }

  private updateDart(player: Player) {
    // Fire at start of each 2500ms cycle (within first 80ms)
    const cycle = this.timer % 2500
    if (cycle < 80) {
      if (!this.burstDone) {
        this.burstDone = true
        this.fireDart(player)
      }
    } else {
      this.burstDone = false
    }
  }

  private fireDart(player: Player) {
    const dx = Math.cos(this.dartDir), dy = Math.sin(this.dartDir)
    const endX = this.x + dx * 220, endY = this.y + dy * 220

    const gfx = this.scene.add.graphics().setDepth(8)
    gfx.lineStyle(3, 0xddbb55, 1)
    gfx.lineBetween(this.x, this.y, endX, endY)
    this.scene.tweens.add({ targets: gfx, alpha: 0, duration: 350, onComplete: () => { if (gfx.active) gfx.destroy() } })

    // Check if player is in path
    const toPlayerAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const diffDeg = Math.abs(Phaser.Math.Angle.ShortestBetween(
      Phaser.Math.RadToDeg(this.dartDir),
      Phaser.Math.RadToDeg(toPlayerAngle)
    ))
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    if (diffDeg < 18 && dist < 220) player.takeDamage(15)
  }
}
