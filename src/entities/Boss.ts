import Phaser from 'phaser'
import type { Player } from './Player'
import { ITEMS } from '../systems/ItemDefs'
import { rollRarity } from '../systems/Rarity'

export type BossType = 'dungeon_master' | 'knight_commander' | 'cave_worm'

interface BossConfig {
  type: BossType
  name: string; texture: string
  hp: number; speed: number; dmg: number
  atkRange: number; atkCd: number; loot: number
  specialCd: number
  phase2SpeedMult: number; phase2DmgMult: number
}

const CONFIGS: Record<BossType, BossConfig> = {
  dungeon_master:   { type: 'dungeon_master',   name: 'Dungeon Master',   texture: 'boss_dungeon_master',   hp: 400, speed: 65, dmg: 25, atkRange: 95, atkCd: 1800, loot: 200, specialCd: 6000, phase2SpeedMult: 1.4, phase2DmgMult: 1.5 },
  knight_commander: { type: 'knight_commander', name: 'Knight Commander', texture: 'boss_knight_commander', hp: 550, speed: 72, dmg: 35, atkRange: 95, atkCd: 2000, loot: 300, specialCd: 5000, phase2SpeedMult: 1.6, phase2DmgMult: 1.3 },
  cave_worm:        { type: 'cave_worm',        name: 'Cave Worm',        texture: 'boss_cave_worm',        hp: 700, speed: 50, dmg: 40, atkRange: 95, atkCd: 2500, loot: 400, specialCd: 4000, phase2SpeedMult: 1.8, phase2DmgMult: 1.2 },
}

export class Boss extends Phaser.Physics.Arcade.Sprite {
  readonly bossName: string
  hp: number
  readonly maxHp: number
  readonly lootValue: number
  private config: BossConfig
  private readonly bossType: BossType
  private atkCooldown = 0
  private specialCooldown: number
  private phase = 1
  private hpBar!: Phaser.GameObjects.Graphics

  // Boss-specific state
  private _lungeTimer = 2000
  private _facingAngle = 0
  private _shieldUp = false
  private _shieldCooldown = 8000
  private _burrowing = false

  constructor(scene: Phaser.Scene, x: number, y: number, type: BossType) {
    const cfg = CONFIGS[type]
    super(scene, x, y, cfg.texture)
    this.config = cfg
    this.bossType = type
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
    this.atkCooldown     = Math.max(0, this.atkCooldown     - delta)
    this.specialCooldown = Math.max(0, this.specialCooldown - delta)

    if (this.phase === 1 && this.hp < this.maxHp * 0.5) this.enterPhase2()

    const speed = this.config.speed * (this.phase === 2 ? this.config.phase2SpeedMult : 1)
    const dist  = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)

    if (dist > 0) this._facingAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)

    // Knight Commander: shield cycle
    if (this.bossType === 'knight_commander') {
      this._shieldCooldown = Math.max(0, this._shieldCooldown - delta)
      if (this._shieldCooldown === 0) {
        this._shieldUp = !this._shieldUp
        this._shieldCooldown = this._shieldUp ? 3000 : 8000
        this.setTint(this._shieldUp ? 0x8888ff : (this.phase === 2 ? 0xff3300 : 0xffffff))
        if (!this._shieldUp && this.phase !== 2) this.clearTint()
      }
    }

    if (dist > this.config.atkRange) {
      const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
      this.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed)
      this.setFlipX(player.x < this.x)

      // Lunge: close the gap when player kites too long (not Cave Worm — it burrows instead)
      if (this.bossType !== 'cave_worm') {
        this._lungeTimer -= delta
        if (this._lungeTimer <= 0) {
          this._lungeTimer = 2500
          this.doLunge(player)
        }
      }
    } else {
      this._lungeTimer = 2000
      this.setVelocity(0, 0)

      if (this.atkCooldown === 0) {
        this.atkCooldown = this.config.atkCd
        if (this.bossType === 'cave_worm') {
          this.spitAtPlayer(player)
        } else {
          const dmg = Math.round(this.config.dmg * (this.phase === 2 ? this.config.phase2DmgMult : 1))
          this.showWarning()
          this.scene.time.delayedCall(260, () => {
            if (!this.active) return
            const d2 = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
            if (d2 < this.config.atkRange * 1.3) {
              player.takeDamage(dmg)
              this.scene.cameras.main.shake(180, 0.010)
            }
            this.setTint(0xff8800)
            this.scene.time.delayedCall(140, () => {
              if (!this.active) return
              this.restoreTint()
            })
          })
        }
      }
    }

    if (this.specialCooldown === 0) {
      this.specialCooldown = this.config.specialCd
      this.doSpecial(player)
    }

    this.drawHpBar()
    this.scene.events.emit('boss-hp', this.hp / this.maxHp)
  }

  private restoreTint() {
    if (this.bossType === 'knight_commander' && this._shieldUp) {
      this.setTint(0x8888ff)
    } else if (this.phase === 2) {
      this.setTint(0xff3300)
    } else {
      this.clearTint()
    }
  }

  private doLunge(player: Player) {
    const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const body = this.body as Phaser.Physics.Arcade.Body
    this.setTint(0xff8800)
    body.setVelocity(Math.cos(ang) * 420, Math.sin(ang) * 420)
    this.scene.time.delayedCall(300, () => {
      if (!this.active) return
      body.setVelocity(0, 0)
      this.restoreTint()
      const d = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
      if (d < this.config.atkRange * 0.9) {
        player.takeDamage(Math.round(this.config.dmg * 0.7))
        this.scene.cameras.main.shake(150, 0.008)
      }
    })
  }

  private spitAtPlayer(player: Player) {
    const targetX = player.x, targetY = player.y
    const gfx = this.scene.add.graphics().setDepth(8)
    gfx.setPosition(this.x, this.y)
    gfx.fillStyle(0x66cc44, 0.9)
    gfx.fillCircle(0, 0, 9)
    this.scene.tweens.add({
      targets: gfx, x: targetX, y: targetY, duration: 500, ease: 'Linear',
      onComplete: () => {
        if (!gfx.active) return
        gfx.destroy()
        if (!this.active) return
        const dist = Phaser.Math.Distance.Between(targetX, targetY, player.x, player.y)
        if (dist < 44) {
          player.takeDamage(this.config.dmg)
          this.scene.cameras.main.shake(120, 0.008)
        }
      },
    })
  }

  private enterPhase2() {
    this.phase = 2
    this.scene.cameras.main.shake(550, 0.018)
    this.scene.cameras.main.flash(350, 255, 60, 0)
    this.setTint(0xff3300)
    this.scene.tweens.add({ targets: this, scaleX: 1.65, scaleY: 1.65, duration: 300, ease: 'Back.Out' })

    const boom = this.scene.add.text(this.x, this.y - 60, 'ENRAGE!', {
      fontSize: '22px', fontStyle: 'bold', color: '#ff3300',
    }).setOrigin(0.5).setDepth(16)
    this.scene.tweens.add({ targets: boom, y: boom.y - 40, alpha: 0, duration: 1200, onComplete: () => { if (boom.active) boom.destroy() } })
  }

  private doSpecial(player: Player) {
    switch (this.bossType) {
      case 'dungeon_master':   this.specialSummon();       break
      case 'knight_commander': this.specialCharge(player); break
      case 'cave_worm':        this.specialBurrow(player); break
    }
  }

  // Dungeon Master: summons skeletons
  private specialSummon() {
    const count = this.phase === 2 ? 3 : 2
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2
      const d   = 60 + Math.random() * 100
      this.scene.events.emit('boss-summon', this.x + Math.cos(ang) * d, this.y + Math.sin(ang) * d)
    }
  }

  // Knight Commander: telegraphed charge
  private specialCharge(player: Player) {
    const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)

    const gfx = this.scene.add.graphics().setDepth(9)
    gfx.lineStyle(4, 0xff0000, 0.7)
    gfx.lineBetween(this.x, this.y, this.x + Math.cos(ang) * 300, this.y + Math.sin(ang) * 300)
    this.scene.tweens.add({ targets: gfx, alpha: 0.1, duration: 450, onComplete: () => { if (gfx.active) gfx.destroy() } })

    this.scene.time.delayedCall(420, () => {
      if (!this.active) return
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setVelocity(Math.cos(ang) * 520, Math.sin(ang) * 520)
      this.scene.time.delayedCall(350, () => {
        if (!this.active) return
        body.setVelocity(0, 0)
        const d = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
        if (d < 68) {
          const dmg = Math.round(this.config.dmg * (this.phase === 2 ? this.config.phase2DmgMult : 1) * 1.5)
          player.takeDamage(dmg)
          this.scene.cameras.main.shake(280, 0.018)
        }
      })
    })
  }

  // Cave Worm: burrows and re-emerges near the player
  private specialBurrow(player: Player) {
    if (this._burrowing) return
    this._burrowing = true

    const doOneBurrow = (callback: () => void) => {
      if (!this.active) { this._burrowing = false; return }
      this.scene.tweens.add({
        targets: this, scaleX: 0, scaleY: 0, alpha: 0, duration: 400, ease: 'Back.In',
        onComplete: () => {
          if (!this.active) { this._burrowing = false; return }
          ;(this.body as Phaser.Physics.Arcade.Body).enable = false
          const ang  = Math.random() * Math.PI * 2
          const dist = 50 + Math.random() * 70
          this.setPosition(player.x + Math.cos(ang) * dist, player.y + Math.sin(ang) * dist)

          this.scene.time.delayedCall(1100, () => {
            if (!this.active) { this._burrowing = false; return }
            ;(this.body as Phaser.Physics.Arcade.Body).enable = true
            this.scene.tweens.add({ targets: this, scaleX: 1.5, scaleY: 1.5, alpha: 1, duration: 300, ease: 'Back.Out' })
            if (Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) < 55) {
              player.takeDamage(Math.round(this.config.dmg * 1.2))
              this.scene.cameras.main.shake(200, 0.012)
            }
            callback()
          })
        },
      })
    }

    if (this.phase === 2) {
      doOneBurrow(() => {
        if (!this.active) { this._burrowing = false; return }
        this.scene.time.delayedCall(300, () => {
          if (!this.active) { this._burrowing = false; return }
          doOneBurrow(() => { this._burrowing = false })
        })
      })
    } else {
      doOneBurrow(() => { this._burrowing = false })
    }
  }

  private showWarning() {
    const w = this.scene.add.text(this.x, this.y - 52, '!', {
      fontSize: '30px', fontStyle: 'bold', color: '#ff2222',
    }).setOrigin(0.5).setDepth(15)
    this.scene.tweens.add({ targets: w, y: w.y - 18, alpha: 0, duration: 380, onComplete: () => { if (w.active) w.destroy() } })
  }

  takeDamage(amount: number, kbAngle = 0, kbForce = 0): boolean {
    // Knight Commander: frontal attacks blocked by shield
    if (this.bossType === 'knight_commander' && this._shieldUp) {
      const diff = Math.abs(Phaser.Math.Angle.Wrap(kbAngle - this._facingAngle))
      if (diff >= Math.PI * 0.4) {
        // Frontal — blocked
        this.setTint(0xffffff)
        this.scene.time.delayedCall(150, () => { if (this.active) this.setTint(0x8888ff) })
        return false
      }
    }

    this.hp -= amount
    if (kbForce > 0) {
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setVelocity(Math.cos(kbAngle) * kbForce * 0.08, Math.sin(kbAngle) * kbForce * 0.08)
    }
    this.setTint(0xff4444)
    this.scene.time.delayedCall(100, () => { if (this.active) this.restoreTint() })
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
  const map: Record<string, BossType> = { dungeon: 'dungeon_master', castle: 'knight_commander', caves: 'cave_worm' }
  return map[theme]
}
