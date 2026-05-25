import Phaser from 'phaser'

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly maxHp = 100
  hp = 100
  readonly attackDamage = 25
  readonly attackRange = 52
  attackActive = false

  private speed = 165
  private atkCooldown = 0
  private readonly ATK_CD = 450

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>
  private spaceKey!: Phaser.Input.Keyboard.Key

  // Touch joystick state
  private touchMoveId = -1
  private touchOrigin = new Phaser.Math.Vector2()
  private touchCurrent = new Phaser.Math.Vector2()

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDepth(5)
    ;(this.body as Phaser.Physics.Arcade.Body).setSize(20, 24)
  }

  setupInput(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!
    this.cursors = kb.createCursorKeys()
    this.wasd = {
      up: kb.addKey('W'), down: kb.addKey('S'),
      left: kb.addKey('A'), right: kb.addKey('D'),
    }
    this.spaceKey = kb.addKey('SPACE')
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
      this.setVelocity(0, 0)
    }
  }

  triggerAttack() {
    if (this.atkCooldown > 0) return
    this.atkCooldown = this.ATK_CD
    this.attackActive = true
    this.scene.events.emit('player-attack')
    this.scene.time.delayedCall(150, () => { this.attackActive = false })
    this.setTint(0xffffaa)
    this.scene.time.delayedCall(150, () => this.clearTint())
  }

  update(delta: number) {
    this.atkCooldown = Math.max(0, this.atkCooldown - delta)

    let vx = 0, vy = 0

    if (this.wasd.left.isDown || this.cursors.left.isDown) vx -= 1
    if (this.wasd.right.isDown || this.cursors.right.isDown) vx += 1
    if (this.wasd.up.isDown || this.cursors.up.isDown) vy -= 1
    if (this.wasd.down.isDown || this.cursors.down.isDown) vy += 1

    if (this.touchMoveId !== -1) {
      const dx = this.touchCurrent.x - this.touchOrigin.x
      const dy = this.touchCurrent.y - this.touchOrigin.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > 12) { vx += dx / d; vy += dy / d }
    }

    const moving = vx !== 0 || vy !== 0
    if (moving) {
      const len = Math.sqrt(vx * vx + vy * vy)
      this.setVelocity((vx / len) * this.speed, (vy / len) * this.speed)
      if (vx !== 0) this.setFlipX(vx < 0)
    } else {
      this.setVelocity(0, 0)
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.triggerAttack()
  }

  takeDamage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - amount)
    this.setTint(0xff3333)
    this.scene.time.delayedCall(200, () => this.hp > 0 && this.clearTint())
    return this.hp <= 0
  }
}
