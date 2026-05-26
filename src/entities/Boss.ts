import Phaser from 'phaser'
import type { Player } from './Player'
import { ITEMS } from '../systems/ItemDefs'
import { rollRarity } from '../systems/Rarity'

export type BossType = 'dungeon_master' | 'knight_commander' | 'cave_worm'

interface BossConfig {
  name: string; texture: string
  hp: number; speed: number; dmg: number
  atkRange: number; atkCd: number; loot: number
  specialCd: number
  phase2SpeedMult: number; phase2DmgMult: number
}

const CONFIGS: Record<BossType, BossConfig> = {
  dungeon_master:   { name:'Dungeon Master',    texture:'boss_dungeon_master',   hp:400, speed:65,  dmg:25, atkRange:48, atkCd:1800, loot:200, specialCd:6000, phase2SpeedMult:1.4, phase2DmgMult:1.5 },
  knight_commander: { name:'Knight Commander',  texture:'boss_knight_commander', hp:550, speed:72,  dmg:35, atkRange:52, atkCd:2000, loot:300, specialCd:5000, phase2SpeedMult:1.6, phase2DmgMult:1.3 },
  cave_worm:        { name:'Cave Worm',         texture:'boss_cave_worm',        hp:700, speed:50,  dmg:40, atkRange:56, atkCd:2500, loot:400, specialCd:4000, phase2SpeedMult:1.8, phase2DmgMult:1.2 },
}

export class Boss extends Phaser.Physics.Arcade.Sprite {
  readonly bossName: string
  hp: number
  readonly maxHp: number
  readonly lootValue: number
  private config: BossConfig
  private atkCooldown = 0
  private specialCooldown: number
  private phase = 1
  private hpBar!: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, x: number, y: number, type: BossType) {
    const cfg = CONFIGS[type]
    super(scene, x, y, cfg.texture)
    this.config = cfg
    this.bossName = cfg.name
    this.hp = cfg.hp
    this.maxHp = cfg.hp
    this.lootValue = cfg.loot
    this.specialCooldown = cfg.specialCd * 1.5

    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDepth(4).setScale(1.5)
    ;(this.body as Phaser.Physics.Arcade.Body).setSize(38, 46)

    this.hpBar = scene.add.graphics().setDepth(6)
    scene.events.emit('boss-spawned', cfg.name, 1.0)
  }

  update(delta: number, player: Player) {
    if (!this.active) return
    this.atkCooldown    = Math.max(0, this.atkCooldown    - delta)
    this.specialCooldown = Math.max(0, this.specialCooldown - delta)

    if (this.phase === 1 && this.hp < this.maxHp * 0.5) this.enterPhase2()

    const speed = this.config.speed * (this.phase === 2 ? this.config.phase2SpeedMult : 1)
    const dist   = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)

    if (dist > this.config.atkRange) {
      const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
      this.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed)
      this.setFlipX(player.x < this.x)
    } else {
      this.setVelocity(0, 0)
      if (this.atkCooldown === 0) {
        this.atkCooldown = this.config.atkCd
        const dmg = Math.round(this.config.dmg * (this.phase === 2 ? this.config.phase2DmgMult : 1))
        this.showWarning()
        this.scene.time.delayedCall(260, () => {
          if (!this.active) return
          const d2 = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
          if (d2 < this.config.atkRange * 1.3) player.takeDamage(dmg)
          this.setTint(0xff8800)
          this.scene.time.delayedCall(140, () => this.active && this.clearTint())
        })
      }
    }

    if (this.specialCooldown === 0) {
      this.specialCooldown = this.config.specialCd
      this.doSpecial(player)
    }

    this.drawHpBar()
    this.scene.events.emit('boss-hp', this.hp / this.maxHp)
  }

  private enterPhase2() {
    this.phase = 2
    this.scene.cameras.main.shake(550, 0.018)
    this.scene.cameras.main.flash(350, 255, 60, 0)
    this.setTint(0xff3300)
    this.scene.tweens.add({ targets: this, scaleX: 1.65, scaleY: 1.65, duration: 300, ease: 'Back.Out' })
    this.scene.time.delayedCall(900, () => this.active && this.clearTint())

    const boom = this.scene.add.text(this.x, this.y - 60, 'ENRAGE!', {
      fontSize: '22px', fontStyle: 'bold', color: '#ff3300',
    }).setOrigin(0.5).setDepth(16)
    this.scene.tweens.add({ targets: boom, y: boom.y - 40, alpha: 0, duration: 1200, onComplete: () => { if (boom.active) boom.destroy() } })
  }

  private doSpecial(player: Player) {
    const radius = 90
    const gfx = this.scene.add.graphics().setDepth(9)
    gfx.lineStyle(4, 0xff0000, 0.9)
    gfx.strokeCircle(this.x, this.y, radius)
    this.scene.tweens.add({ targets: gfx, alpha: 0.15, duration: 500, yoyo: true })

    this.scene.time.delayedCall(650, () => {
      if (!this.active) { gfx.destroy(); return }
      gfx.destroy()
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
      const dmg = Math.round(this.config.dmg * (this.phase === 2 ? this.config.phase2DmgMult * 1.5 : 1.5))
      if (dist < radius) player.takeDamage(dmg)

      const burst = this.scene.add.graphics().setDepth(10)
      burst.fillStyle(0xff2200, 0.4)
      burst.fillCircle(this.x, this.y, radius)
      this.scene.tweens.add({ targets: burst, alpha: 0, duration: 350, onComplete: () => { if (burst.active) burst.destroy() } })
    })
  }

  private showWarning() {
    const w = this.scene.add.text(this.x, this.y - 52, '!', {
      fontSize: '30px', fontStyle: 'bold', color: '#ff2222',
    }).setOrigin(0.5).setDepth(15)
    this.scene.tweens.add({ targets: w, y: w.y - 18, alpha: 0, duration: 380, onComplete: () => { if (w.active) w.destroy() } })
  }

  takeDamage(amount: number, kbAngle = 0, kbForce = 0): boolean {
    this.hp -= amount
    if (kbForce > 0) {
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setVelocity(Math.cos(kbAngle) * kbForce * 0.08, Math.sin(kbAngle) * kbForce * 0.08)
    }
    this.setTint(0xff4444)
    this.scene.time.delayedCall(100, () => this.active && this.clearTint())
    this.drawHpBar()
    if (this.hp <= 0) {
      this.hpBar.destroy()
      this.spawnDrop()
      this.scene.events.emit('boss-defeated')
      this.destroy()
      return true
    }
    return false
  }

  private spawnDrop() {
    const rarity = rollRarity('boss', 1.0)!
    const pool = ITEMS.filter(i => i.rarity === rarity && i.slotType !== 'consumable')
    if (pool.length === 0) return
    const item = pool[Math.floor(Math.random() * pool.length)]
    this.scene.events.emit('boss-drop', item, this.x, this.y)
  }

  private drawHpBar() {
    if (!this.active || !this.hpBar) return
    const pct = Math.max(0, this.hp / this.maxHp)
    const bw = 56
    this.hpBar.clear()
    this.hpBar.fillStyle(0x330000)
    this.hpBar.fillRect(this.x - bw / 2, this.y - 42, bw, 7)
    this.hpBar.fillStyle(0xee2222)
    this.hpBar.fillRect(this.x - bw / 2, this.y - 42, bw * pct, 7)
  }

  destroy(fromScene = false) {
    this.hpBar?.destroy()
    super.destroy(fromScene)
  }
}

export function getBossType(theme: 'dungeon' | 'castle' | 'caves'): BossType {
  const map: Record<string, BossType> = { dungeon:'dungeon_master', castle:'knight_commander', caves:'cave_worm' }
  return map[theme]
}
