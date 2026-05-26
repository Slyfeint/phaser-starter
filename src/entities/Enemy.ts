import Phaser from 'phaser'
import type { Player } from './Player'
import type { ItemDef } from '../systems/ItemDefs'
import { WEAPON_ITEMS, ARMOR_ITEMS } from '../systems/ItemDefs'
import { rollRarity } from '../systems/Rarity'
import type { EnemyTier } from '../systems/Rarity'
import { type StatusEffect, applyStatus, tickStatuses, pruneExpired, SLOW } from '../systems/StatusEffect'

export type EnemyType = 'skeleton' | 'orc' | 'bat' | 'spider' | 'guard' | 'knight' | 'dark_mage' | 'cave_troll' | 'berserker' | 'golem' | 'wraith'
type AIPattern = 'melee' | 'erratic' | 'burst' | 'ranged'

interface EnemyStat {
  hp: number; speed: number; dmg: number
  chaseRange: number; atkRange: number
  loot: number; atkCd: number; kbResist: number
  dropChance: number; tier: EnemyTier; ai: AIPattern
}

const STATS: Record<EnemyType, EnemyStat> = {
  skeleton:   { hp:30,  speed:85,  dmg:8,  chaseRange:160, atkRange:36,  loot:15, atkCd:1200, kbResist:1.0, dropChance:0.20, tier:'regular', ai:'melee'   },
  orc:        { hp:65,  speed:58,  dmg:20, chaseRange:200, atkRange:44,  loot:35, atkCd:2000, kbResist:0.35,dropChance:0.40, tier:'regular', ai:'melee'   },
  bat:        { hp:15,  speed:140, dmg:5,  chaseRange:200, atkRange:28,  loot:8,  atkCd:800,  kbResist:1.2, dropChance:0.10, tier:'regular', ai:'erratic' },
  spider:     { hp:25,  speed:55,  dmg:12, chaseRange:170, atkRange:32,  loot:12, atkCd:1500, kbResist:0.8, dropChance:0.15, tier:'regular', ai:'burst'   },
  guard:      { hp:45,  speed:75,  dmg:15, chaseRange:170, atkRange:38,  loot:20, atkCd:1400, kbResist:0.7, dropChance:0.25, tier:'regular', ai:'melee'   },
  knight:     { hp:80,  speed:55,  dmg:28, chaseRange:180, atkRange:42,  loot:40, atkCd:2200, kbResist:0.2, dropChance:0.45, tier:'elite',   ai:'melee'   },
  dark_mage:  { hp:30,  speed:65,  dmg:18, chaseRange:200, atkRange:140, loot:25, atkCd:2200, kbResist:1.0, dropChance:0.30, tier:'regular', ai:'ranged'  },
  cave_troll: { hp:100, speed:45,  dmg:35, chaseRange:200, atkRange:50,  loot:55, atkCd:2500, kbResist:0.1, dropChance:0.55, tier:'elite',   ai:'melee'   },
  berserker:  { hp:45,  speed:95,  dmg:28, chaseRange:220, atkRange:40,  loot:30, atkCd:1000, kbResist:0.6, dropChance:0.35, tier:'regular', ai:'melee'   },
  golem:      { hp:130, speed:38,  dmg:38, chaseRange:200, atkRange:52,  loot:60, atkCd:3000, kbResist:0.05,dropChance:0.55, tier:'elite',   ai:'melee'   },
  wraith:     { hp:22,  speed:110, dmg:12, chaseRange:240, atkRange:180, loot:20, atkCd:3500, kbResist:1.5, dropChance:0.25, tier:'regular', ai:'ranged'  },
}

const TEXTURE: Record<EnemyType, string> = {
  skeleton: 'enemy_skeleton', orc: 'enemy_orc', bat: 'enemy_bat',
  spider: 'enemy_spider', guard: 'enemy_guard', knight: 'enemy_knight',
  dark_mage: 'enemy_dark_mage', cave_troll: 'enemy_cave_troll',
  berserker: 'enemy_orc', golem: 'enemy_cave_troll', wraith: 'enemy_bat',
}

const TINT: Partial<Record<EnemyType, number>> = {
  berserker: 0xff8844,
  golem:     0x8899aa,
  wraith:    0xaa66ff,
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number
  readonly lootValue: number
  readonly isMiniboss: boolean
  private readonly stats: EnemyStat
  private atkCooldown = 0
  private aiState: 'idle' | 'chase' | 'attack' = 'idle'
  private timeAccum = 0
  private burstCooldown = 0
  private hpBar!: Phaser.GameObjects.Graphics
  private starLabel?: Phaser.GameObjects.Text
  private readonly _type: EnemyType
  private _wallChecker?: (x1: number, y1: number, x2: number, y2: number) => boolean
  private _lastHpDrawn = -1
  private _hasAggrod = false
  private _statusEffects: StatusEffect[] = []
  private _statusTintTimer = 0
  private _slowMult = 1
  private _speedMult = 1
  private _dmgMult = 1
  private _berserkMode = false
  private _stompTimer = 4000
  private _phaseTimer = 4000
  private _phaseActive = false
  private _blindedTimer = 0

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType = 'skeleton', miniboss = false, floor = 1) {
    super(scene, x, y, TEXTURE[type])
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDepth(4)
    this._type = type
    this.isMiniboss = miniboss
    const tintColor = TINT[type]
    if (tintColor) this.setTint(tintColor)

    const base = STATS[type]
    const floorMult = 1 + (floor - 1) * 0.25
    const diff = scene.registry.get('diffMult') as { hp: number; dmg: number } | null
    const hpM = diff?.hp ?? 1, dmgM = diff?.dmg ?? 1
    this.stats = miniboss
      ? { ...base, hp: Math.round(base.hp * 3 * hpM), dmg: Math.round(base.dmg * 2 * dmgM),
          speed: base.speed * 1.3, dropChance: 1.0, tier: 'miniboss' as EnemyTier }
      : { ...base, hp: Math.round(base.hp * floorMult * hpM), dmg: Math.round(base.dmg * floorMult * dmgM) }

    this.hp = this.stats.hp
    this.lootValue = miniboss ? base.loot * 5 : base.loot
    ;(this.body as Phaser.Physics.Arcade.Body).setSize(20, 24)

    if (miniboss) {
      this.setTint(0xffcc00)
      this.starLabel = scene.add.text(x, y - 32, '★', { fontSize: '14px', color: '#ffcc00' })
        .setOrigin(0.5).setDepth(7)
    }

    this.hpBar = scene.add.graphics().setDepth(6)
  }

  hpPct(): number { return this.hp / this.stats.hp }

  get enemyType(): EnemyType { return this._type }

  hasStatus(id: string): boolean {
    return this._statusEffects.some(e => e.id === id && e.duration > 0)
  }

  setWallChecker(fn: (x1: number, y1: number, x2: number, y2: number) => boolean) {
    this._wallChecker = fn
  }

  setBlinded(ms: number) { this._blindedTimer = Math.max(this._blindedTimer, ms) }

  applyStatus(effect: StatusEffect) {
    applyStatus(this._statusEffects, effect)
    // Flash tint to indicate status applied
    const tintMap: Record<string, number> = { bleed: 0xff2222, stagger: 0xaaaaff, cripple: 0x8888ff, slow: 0x4488ff, poison: 0x44bb44 }
    const tint = tintMap[effect.id]
    if (tint && this.active) {
      this.setTint(tint)
      this.scene.time.delayedCall(250, () => { if (this.active) this.clearTint() })
    }
  }

  update(delta: number, player: Player) {
    if (!this.active) return
    this.atkCooldown = Math.max(0, this.atkCooldown - delta)
    this.burstCooldown = Math.max(0, this.burstCooldown - delta)
    this.timeAccum += delta
    this._statusTintTimer = Math.max(0, this._statusTintTimer - delta)

    // Blinded: wander randomly instead of chasing
    if (this._blindedTimer > 0) {
      this._blindedTimer -= delta
      const randAngle = Math.random() * Math.PI * 2
      const spd = this.stats.speed * 0.5
      this.setVelocity(Math.cos(randAngle) * spd, Math.sin(randAngle) * spd)
      if (this.starLabel) this.starLabel.setPosition(this.x, this.y - 32)
      this.drawHpBar()
      return
    }

    // Tick status effects
    if (this._statusEffects.length > 0) {
      const { damage, slowMult } = tickStatuses(this._statusEffects, delta)
      if (damage > 0) {
        this.hp -= damage
        this.drawHpBar()
        if (this.hp <= 0) {
          this.hpBar.destroy()
          this.spawnDeathParticles()
          this.scene.events.emit('enemy-killed-by-dot', this)
          this.destroy()
          return
        }
      }
      // Apply slow — stored for AI velocity calculations
      this._slowMult = slowMult
      this._statusEffects = pruneExpired(this._statusEffects)
    } else {
      this._slowMult = 1
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)

    if (dist < this.stats.atkRange)         this.aiState = 'attack'
    else if (dist < this.stats.chaseRange)  this.aiState = 'chase'
    else                                     this.aiState = 'idle'

    if (this.aiState !== 'idle' && !this._hasAggrod) {
      this._hasAggrod = true
      this.showAggroIndicator()
    }

    // Special type behaviors
    if (this._type === 'berserker') this.updateBerserker()
    if (this._type === 'golem')     this.updateGolem(delta, player)
    if (this._type === 'wraith')    this.updateWraith(delta)
    if (this._phaseActive) { if (this.starLabel) this.starLabel.setPosition(this.x, this.y - 32); this.drawHpBar(); return }

    switch (this.stats.ai) {
      case 'melee':   this.updateMelee(delta, dist, player); break
      case 'erratic': this.updateErratic(dist, player); break
      case 'burst':   this.updateBurst(delta, dist, player); break
      case 'ranged':  this.updateRanged(delta, dist, player); break
    }

    if (this.starLabel) this.starLabel.setPosition(this.x, this.y - 32)
    this.drawHpBar()
  }

  private updateMelee(_delta: number, _dist: number, player: Player) {
    if (this.aiState === 'idle') { this.setVelocity(0, 0); return }
    if (this.aiState === 'chase') {
      const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
      const spd = this.stats.speed * this._slowMult * this._speedMult
      this.setVelocity(Math.cos(ang) * spd, Math.sin(ang) * spd)
      this.setFlipX(player.x < this.x)
      return
    }
    this.setVelocity(0, 0)
    if (this.atkCooldown === 0) {
      this.atkCooldown = this.stats.atkCd
      this.showAttackWarning()
      this.scene.time.delayedCall(280, () => {
        if (!this.active) return
        const d2 = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
        if (d2 < this.stats.atkRange * 1.3) {
          if (this._wallChecker?.(this.x, this.y, player.x, player.y)) return
          this.showSwingArc(player)
          if (!player.smokeActive) player.takeDamage(Math.round(this.stats.dmg * this._dmgMult))
          this.setTint(0xff8800)
          this.scene.time.delayedCall(110, () => this.active && (TINT[this._type] ? this.setTint(TINT[this._type]!) : this.clearTint()))
        }
      })
    }
  }

  private updateBerserker() {
    if (this._berserkMode) return
    if (this.hp / this.stats.hp < 0.30) {
      this._berserkMode = true
      this._speedMult = 1.6
      this._dmgMult   = 1.4
      this.setTint(0xff2200)
      this.scene.tweens.add({ targets: this, alpha: 0.65, duration: 200, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
    }
  }

  private updateGolem(delta: number, player: Player) {
    this._stompTimer -= delta
    if (this._stompTimer <= 0) {
      this._stompTimer = 4000
      const d = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
      const ring = this.scene.add.circle(this.x, this.y, 8, 0x886644, 0)
      ring.setDepth(9).setStrokeStyle(3, 0xffcc44, 0.9)
      this.scene.tweens.add({
        targets: ring, scaleX: 7.5, scaleY: 7.5, alpha: 0, duration: 400,
        onComplete: () => { if (ring.active) ring.destroy() },
      })
      if (d < 60) player.takeDamage(Math.round(this.stats.dmg * 0.8))
    }
  }

  private updateWraith(delta: number) {
    this._phaseTimer -= delta
    if (this._phaseTimer <= 0 && !this._phaseActive) {
      this._phaseActive = true
      this.setAlpha(0.25)
      ;(this.body as Phaser.Physics.Arcade.Body).enable = false
      this.setVelocity(0, 0)
      this.scene.time.delayedCall(1200, () => {
        if (!this.active) return
        this._phaseActive = false
        this._phaseTimer = 3000 + Math.random() * 2000
        this.setAlpha(0.85)
        ;(this.body as Phaser.Physics.Arcade.Body).enable = true
      })
    }
  }

  private showSwingArc(player: Player) {
    const gfx = this.scene.add.graphics().setDepth(9)
    const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const sweep = Math.PI * 0.55
    gfx.fillStyle(0xff8800, 0.6)
    gfx.slice(this.x, this.y, 28, ang - sweep / 2, ang + sweep / 2, false)
    gfx.fillPath()
    this.scene.tweens.add({ targets: gfx, alpha: 0, duration: 200, onComplete: () => { if (gfx.active) gfx.destroy() } })
  }

  private updateErratic(dist: number, player: Player) {
    if (dist > this.stats.chaseRange) { this.setVelocity(0, 0); return }
    const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const sine = Math.sin(this.timeAccum * 0.004) * 90
    const perp = ang + Math.PI / 2
    const spd = this.stats.speed * this._slowMult * this._speedMult
    this.setVelocity(
      Math.cos(ang) * spd + Math.cos(perp) * sine * this._slowMult,
      Math.sin(ang) * spd + Math.sin(perp) * sine * this._slowMult
    )
    if (dist < this.stats.atkRange && this.atkCooldown === 0) {
      this.atkCooldown = this.stats.atkCd
      if (!this._wallChecker?.(this.x, this.y, player.x, player.y) && !player.smokeActive) {
        player.takeDamage(this.stats.dmg)
      }
    }
  }

  private updateBurst(_delta: number, dist: number, player: Player) {
    if (dist > this.stats.chaseRange) { this.setVelocity(0, 0); return }
    if (this.burstCooldown <= 0 && dist < this.stats.chaseRange) {
      this.burstCooldown = 2200
      const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
      this.setVelocity(Math.cos(ang) * this.stats.speed * 3.2, Math.sin(ang) * this.stats.speed * 3.2)
      this.setTint(0xaa2222)
      this.scene.time.delayedCall(320, () => {
        if (!this.active) return
        this.setVelocity(0, 0)
        this.clearTint()
        const d2 = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
        if (d2 < this.stats.atkRange * 1.5 && !this._wallChecker?.(this.x, this.y, player.x, player.y)) {
          player.takeDamage(this.stats.dmg)
        }
      })
    }
  }

  private updateRanged(_delta: number, dist: number, player: Player) {
    const preferred = 120
    if (dist < preferred * 0.6) {
      const ang = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y)
      this.setVelocity(Math.cos(ang) * this.stats.speed, Math.sin(ang) * this.stats.speed)
    } else if (dist > preferred * 1.4) {
      const ang = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
      this.setVelocity(Math.cos(ang) * this.stats.speed * 0.6, Math.sin(ang) * this.stats.speed * 0.6)
    } else {
      this.setVelocity(0, 0)
    }
    if (this.atkCooldown === 0 && dist < this.stats.atkRange) {
      this.atkCooldown = this.stats.atkCd
      this.castBolt(player, dist)
    }
  }

  private castBolt(player: Player, dist: number) {
    const gfx = this.scene.add.graphics().setDepth(8)
    gfx.lineStyle(3, 0xaa00ff, 0.9)
    gfx.lineBetween(this.x, this.y, player.x, player.y)
    this.setTint(0xcc00ff)
    this.scene.tweens.add({ targets: gfx, alpha: 0, duration: 280, onComplete: () => { if (gfx.active) gfx.destroy() } })
    this.scene.time.delayedCall(140, () => {
      if (!this.active) return
      this.clearTint()
      const d2 = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
      if (d2 < dist * 1.2 && !this._wallChecker?.(this.x, this.y, player.x, player.y)) {
        player.takeDamage(this.stats.dmg)
        player.applyStatus(SLOW())
      }
    })
  }

  private showAttackWarning() {
    const warn = this.scene.add.text(this.x, this.y - 28, '!', {
      fontSize: '24px', fontStyle: 'bold', color: '#ff2222', stroke: '#880000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15).setScale(0.4)
    this.scene.tweens.add({ targets: warn, scaleX: 1.2, scaleY: 1.2, duration: 120, ease: 'Back.Out',
      onComplete: () => {
        if (!this.active || !warn.active) return
        this.scene.tweens.add({ targets: warn, y: warn.y - 14, alpha: 0, duration: 300,
          onComplete: () => { if (warn.active) warn.destroy() }
        })
      }
    })
  }

  takeDamage(amount: number, knockbackAngle = 0, knockbackForce = 0): boolean {
    this.hp -= amount
    if (knockbackForce > 0 && this.stats.kbResist > 0) {
      const force = Math.min(knockbackForce, 200) * this.stats.kbResist
      ;(this.body as Phaser.Physics.Arcade.Body).setVelocity(
        Math.cos(knockbackAngle) * force,
        Math.sin(knockbackAngle) * force
      )
    }
    this.setTint(0xff4444)
    const restoreTint = TINT[this._type] ?? (this.isMiniboss ? 0xffcc00 : 0)
    this.scene.time.delayedCall(100, () => { if (this.active) { if (restoreTint) this.setTint(restoreTint); else this.clearTint() } })
    this.drawHpBar()
    if (this.hp <= 0) {
      this.hpBar.destroy()
      this.spawnDeathParticles()
      if (this.isMiniboss) this.scene.events.emit('miniboss-killed', this)
      this.destroy()
      return true
    }
    return false
  }

  private showAggroIndicator() {
    const ind = this.scene.add.text(this.x, this.y - 28, '!', {
      fontSize: '18px', fontStyle: 'bold', color: '#ff8800', stroke: '#441100', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15)
    this.scene.tweens.add({ targets: ind, y: ind.y - 16, alpha: 0, duration: 600,
      onComplete: () => { if (ind.active) ind.destroy() } })
  }

  private spawnDeathParticles() {
    const baseColors = this.isMiniboss ? [0xffcc00, 0xff8800, 0xffff44]
      : this._type === 'wraith' ? [0xaa44ff, 0xcc66ff, 0x8822cc]
      : this._type === 'golem'  ? [0xffcc00, 0x886644, 0xaabbcc]
      : [0xff4444, 0xcc2222, 0xff8800]
    const count = 8
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.4
      const speed = 45 + Math.random() * 70
      const p = this.scene.add.graphics().setDepth(15)
      p.fillStyle(baseColors[i % baseColors.length], 1)
      p.fillRect(-3, -3, 6, 6)
      p.setPosition(this.x, this.y)
      this.scene.tweens.add({ targets: p,
        x: this.x + Math.cos(angle) * speed, y: this.y + Math.sin(angle) * speed,
        alpha: 0, duration: 360, ease: 'Power2',
        onComplete: () => { if (p.active) p.destroy() } })
    }
  }

  rollDrop(legendaryBonus = 0): ItemDef | null {
    const rarity = rollRarity(this.stats.tier, this.stats.dropChance, legendaryBonus)
    if (!rarity) return null
    const pool = Math.random() < 0.5 ? WEAPON_ITEMS : ARMOR_ITEMS
    const rarityPool = pool.filter(i => i.rarity === rarity)
    const fallback = pool.filter(i => i.rarity === 'common')
    const candidates = rarityPool.length > 0 ? rarityPool : fallback
    return candidates[Math.floor(Math.random() * candidates.length)] ?? null
  }

  private drawHpBar() {
    if (!this.active || !this.hpBar) return
    if (this.hp === this._lastHpDrawn && !this.isMiniboss) return
    this._lastHpDrawn = this.hp
    const pct = Math.max(0, this.hp / this.stats.hp)
    if (pct >= 1 && !this.isMiniboss) { this.hpBar.clear(); return }
    const bw = this.isMiniboss ? 36 : 24
    this.hpBar.clear()
    this.hpBar.fillStyle(0x330000)
    this.hpBar.fillRect(this.x - bw / 2, this.y - 24, bw, 4)
    this.hpBar.fillStyle(this.isMiniboss ? 0xffaa00 : 0xee2222)
    this.hpBar.fillRect(this.x - bw / 2, this.y - 24, bw * pct, 4)
  }

  destroy(fromScene = false) {
    this.hpBar?.destroy()
    this.starLabel?.destroy()
    super.destroy(fromScene)
  }
}
