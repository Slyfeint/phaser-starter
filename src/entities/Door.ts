import Phaser from 'phaser'

export class Door extends Phaser.Physics.Arcade.Sprite {
  private _isOpen = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'door_closed')
    scene.add.existing(this)
    scene.physics.add.existing(this, false)
    this.setDepth(3)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setImmovable(true)
    body.setSize(20, 20)
  }

  get isOpen(): boolean { return this._isOpen }

  toggle() {
    this._isOpen = !this._isOpen
    const body = this.body as Phaser.Physics.Arcade.Body
    if (this._isOpen) {
      this.setTexture('door_open')
      body.enable = false
    } else {
      this.setTexture('door_closed')
      body.enable = true
    }
  }

  openIfClosed() {
    if (!this._isOpen) this.toggle()
  }
}
