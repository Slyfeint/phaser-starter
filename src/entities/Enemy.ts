import Phaser from 'phaser'
import type { Player } from './Player'

export type EnemyType = 'skeleton' | 'orc'

const STATS = {
  skeleton: { hp: 30, speed: 85,  dmg: 8,  chaseRange: 160, atkRange: 36, loot: 15, atkCd: 1200 },
  orc:      { hp: 65, speed: 58,  dmg: 20, chaseRange: 200, atkRange: 44, loot: 35, atkCd: 2000 },
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number
  readonly lootValue: number
  private readonly stats: typeof STATS[EnemyType]
  private atkCooldown = 0
  private aiState: 'idle' | 'chase' | 'attack' = 'idle'

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType = 'skeleton') {
    super(scene, x, y, type === 'orc' ? 'enemy_orc' : 'enemy_skeleton')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDepth(4)
    this.stats = STATS[type]
    this.hp = this.stats.hp
    this.lootValue = this.stats.loot
    ;(this.body as Phaser.Physics.Arcade.Body).setSize(20, 24)
  }

  update(delta: number, player: Player) {
    if (!this.active) return
    this.atkCooldown = Math.max(0, this.atkCooldown - delta)

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)

    if (dist < this.stats.atkRange) this.aiState = 'attack'
    else if (dist < this.stats.chaseRange) this.aiState = 'chase'
    else this.aiState = 'idle'

    switch (this.aiState) {
      case 'idle':
        this.setVelocity(0, 0)
        break
      case 'chase': {
        const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
        this.setVelocity(Math.cos(ang) * this.stats.speed, Math.sin(ang) * this.stats.speed)
        this.setFlipX(player.x < this.x)
        break
      }
      case 'attack':
        this.setVelocity(0, 0)
        if (this.atkCooldown === 0) {
          this.atkCooldown = this.stats.atkCd
          player.takeDamage(this.stats.dmg)
          this.setTint(0xff8800)
          this.scene.time.delayedCall(120, () => this.active && this.clearTint())
        }
        break
    }
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount
    this.setTint(0xff4444)
    this.scene.time.delayedCall(100, () => this.active && this.clearTint())
    if (this.hp <= 0) { this.destroy(); return true }
    return false
  }
}
