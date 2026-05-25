import Phaser from 'phaser'
import type { Player } from './Player'
import type { ItemDef } from '../systems/ItemDefs'
import { WEAPON_ITEMS, ARMOR_ITEMS } from '../systems/ItemDefs'

export type EnemyType = 'skeleton' | 'orc'

const STATS = {
  skeleton: { hp: 30, speed: 85,  dmg: 8,  chaseRange: 160, atkRange: 36, loot: 15, atkCd: 1200, kbResist: 1.0,  dropChance: 0.20 },
  orc:      { hp: 65, speed: 58,  dmg: 20, chaseRange: 200, atkRange: 44, loot: 35, atkCd: 2000, kbResist: 0.35, dropChance: 0.40 },
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number
  readonly lootValue: number
  private readonly stats: typeof STATS[EnemyType]
  private atkCooldown = 0
  private aiState: 'idle' | 'chase' | 'attack' = 'idle'
  private hpBar!: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType = 'skeleton') {
    super(scene, x, y, type === 'orc' ? 'enemy_orc' : 'enemy_skeleton')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDepth(4)
    this.stats = STATS[type]
    this.hp = this.stats.hp
    this.lootValue = this.stats.loot
    ;(this.body as Phaser.Physics.Arcade.Body).setSize(20, 24)
    this.hpBar = scene.add.graphics().setDepth(6)
  }

  update(delta: number, player: Player) {
    if (!this.active) return
    this.atkCooldown = Math.max(0, this.atkCooldown - delta)

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)

    if (dist < this.stats.atkRange)    this.aiState = 'attack'
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

    this.drawHpBar()
  }

  takeDamage(amount: number, knockbackAngle = 0, knockbackForce = 0): boolean {
    this.hp -= amount
    if (knockbackForce > 0) {
      const force = knockbackForce * this.stats.kbResist
      ;(this.body as Phaser.Physics.Arcade.Body).setVelocity(
        Math.cos(knockbackAngle) * force,
        Math.sin(knockbackAngle) * force
      )
    }
    this.setTint(0xff4444)
    this.scene.time.delayedCall(100, () => this.active && this.clearTint())
    this.drawHpBar()
    if (this.hp <= 0) {
      this.hpBar.destroy()
      this.destroy()
      return true
    }
    return false
  }

  rollDrop(): ItemDef | null {
    if (Math.random() > this.stats.dropChance) return null
    const pool = Math.random() < 0.5 ? WEAPON_ITEMS : ARMOR_ITEMS
    return pool[Math.floor(Math.random() * pool.length)]
  }

  private drawHpBar() {
    if (!this.active || !this.hpBar) return
    const pct = Math.max(0, this.hp / this.stats.hp)
    if (pct >= 1) { this.hpBar.clear(); return }
    const bw = 24
    this.hpBar.clear()
    this.hpBar.fillStyle(0x330000)
    this.hpBar.fillRect(this.x - bw / 2, this.y - 24, bw, 4)
    this.hpBar.fillStyle(0xee2222)
    this.hpBar.fillRect(this.x - bw / 2, this.y - 24, bw * pct, 4)
  }

  destroy(fromScene = false) {
    this.hpBar?.destroy()
    super.destroy(fromScene)
  }
}
