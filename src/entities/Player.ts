import Phaser from 'phaser'
import { Inventory } from '../systems/Inventory'
import { Bag } from '../systems/Bag'
import { WEAPONS, type WeaponDef } from '../systems/WeaponDefs'
import { getKey } from '../systems/KeyBindings'

export class Player extends Phaser.Physics.Arcade.Sprite {
  maxHp = 100
  hp = 100
  facingAngle = 0

  readonly inventory = new Inventory()
  readonly bag = new Bag()
  activeSlot: 0 | 1 = 0

  private _cosmeticTint = 0xffffff
  private baseSpeed = 165
  private atkCooldown = 0
  private isRolling = false
  private rollCooldown = 0
  private readonly ROLL_CD = 1200
  private readonly ROLL_DURATION = 200

  private hpGfx!: Phaser.GameObjects.Graphics
  private hpTimer = 0
  private readonly HP_SHOW_MS = 2200

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<string, Phaser.Input.Keyboard.Key>

  private touchMoveId = -1
  private touchOrigin = new Phaser.Math.Vector2()
  private touchCurrent = new Phaser.Math.Vector2()

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDepth(5)
    ;(this.body as Phaser.Physics.Arcade.Body).setSize(20, 24)
    this.hpGfx = scene.add.graphics().setDepth(7)
  }

  get currentWeapon(): WeaponDef {
    const stats = this.inventory.getStats()
    return (this.activeSlot === 0 ? stats.weapon1 : stats.weapon2) ?? WEAPONS.sword
  }

  get attackCooldownMax(): number {
    return this.currentWeapon.cooldown * this.inventory.getStats().atkSpeedMult
  }

  get moveSpeed(): number {
    return this.baseSpeed + this.inventory.getStats().speedBonus
  }

  get effectiveMaxHp(): number {
    return this.maxHp + this.inventory.getStats().maxHpBonus
  }

  get rolling(): boolean { return this.isRolling }
  get atkCooldownRemaining(): number { return this.atkCooldown }

  setCosmeticTint(tint: number) {
    this._cosmeticTint = tint
    if (tint !== 0xffffff) this.setTint(tint)
    else this.clearTint()
  }

  private restoreCosmeticTint() {
    if (this._cosmeticTint !== 0xffffff) this.setTint(this._cosmeticTint)
    else this.clearTint()
  }

  setupInput(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!
    this.cursors = kb.createCursorKeys()
    this.keys = {
      up:     kb.addKey(getKey('up',     'W')),
      down:   kb.addKey(getKey('down',   'S')),
      left:   kb.addKey(getKey('left',   'A')),
      right:  kb.addKey(getKey('right',  'D')),
      attack: kb.addKey(getKey('attack', 'SPACE')),
      roll:   kb.addKey(getKey('roll',   'Q')),
      swap:   kb.addKey(getKey('swap',   'F')),
    }
  }

  startTouchMove(id: number, x: number, y: number) {
    if (this.touchMoveId !== -1) return
    this.touchMoveId = id
    this.touchOrigin.set(x, y)
    this.touchCurrent.set(x, y)
  }

  updateTouchMove(id: number, x: number, y: number) {
    if (id === this.touchMoveId) this.touchCurrent.set(x, y)
  }

  endTouchMove(id: number) {
    if (id === this.touchMoveId) {
      this.touchMoveId = -1
      if (!this.isRolling) this.setVelocity(0, 0)
    }
  }

  triggerAttack() {
    if (this.atkCooldown > 0 || this.isRolling) return
    this.atkCooldown = this.attackCooldownMax
    this.scene.events.emit('player-attack')
    this.setTint(0xffffaa)
    this.scene.time.delayedCall(120, () => { if (this.active) this.restoreCosmeticTint() })
  }

  triggerRoll() {
    if (this.rollCooldown > 0 || this.isRolling) return
    this.isRolling = true
    this.rollCooldown = this.ROLL_CD
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(
      Math.cos(this.facingAngle) * this.moveSpeed * 2.5,
      Math.sin(this.facingAngle) * this.moveSpeed * 2.5,
    )
    this.scene.tweens.add({ targets: this, alpha: 0.3, duration: 55, yoyo: true, repeat: 3 })
    this.scene.time.delayedCall(this.ROLL_DURATION, () => { if (this.active) this.isRolling = false })
  }

  swapWeapon() { this.activeSlot = this.activeSlot === 0 ? 1 : 0 }

  update(delta: number) {
    this.atkCooldown  = Math.max(0, this.atkCooldown  - delta)
    this.rollCooldown = Math.max(0, this.rollCooldown - delta)

    if (this.hpTimer > 0) {
      this.hpTimer -= delta
      this.drawHpAboveHead()
      if (this.hpTimer <= 0) this.hpGfx.clear()
    }

    if (this.isRolling) return

    let vx = 0, vy = 0
    if (this.keys.left.isDown  || this.cursors.left.isDown)  vx -= 1
    if (this.keys.right.isDown || this.cursors.right.isDown) vx += 1
    if (this.keys.up.isDown    || this.cursors.up.isDown)    vy -= 1
    if (this.keys.down.isDown  || this.cursors.down.isDown)  vy += 1

    if (this.touchMoveId !== -1) {
      const dx = this.touchCurrent.x - this.touchOrigin.x
      const dy = this.touchCurrent.y - this.touchOrigin.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > 12) { vx += dx / d; vy += dy / d }
    }

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy)
      const nx = vx / len, ny = vy / len
      this.setVelocity(nx * this.moveSpeed, ny * this.moveSpeed)
      this.facingAngle = Math.atan2(ny, nx)
      if (vx !== 0) this.setFlipX(vx < 0)
    } else {
      this.setVelocity(0, 0)
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) this.triggerAttack()
    if (Phaser.Input.Keyboard.JustDown(this.keys.roll))   this.triggerRoll()
    if (Phaser.Input.Keyboard.JustDown(this.keys.swap))   this.swapWeapon()
  }

  takeDamage(amount: number): boolean {
    if (this.isRolling) return false
    const reduced = Math.max(1, Math.round(amount * (1 - this.inventory.getStats().armor / 100)))
    this.hp = Math.max(0, this.hp - reduced)
    this.hpTimer = this.HP_SHOW_MS
    this.setTint(0xff3333)
    this.scene.time.delayedCall(200, () => { if (this.active && this.hp > 0) this.restoreCosmeticTint() })
    if (this.hp <= 0) this.scene.events.emit('player-dead')
    return this.hp <= 0
  }

  heal(amount: number) {
    this.hp = Math.min(this.effectiveMaxHp, this.hp + amount)
    this.hpTimer = this.HP_SHOW_MS
  }

  private drawHpAboveHead() {
    const pct = this.hp / this.effectiveMaxHp
    const bw = 30
    this.hpGfx.clear()
    this.hpGfx.fillStyle(0x220000)
    this.hpGfx.fillRect(this.x - bw / 2, this.y - 30, bw, 5)
    this.hpGfx.fillStyle(pct > 0.5 ? 0x44ee44 : pct > 0.25 ? 0xeecc00 : 0xee2222)
    this.hpGfx.fillRect(this.x - bw / 2, this.y - 30, bw * pct, 5)
  }

  destroy(fromScene = false) {
    this.hpGfx?.destroy()
    super.destroy(fromScene)
  }
}
