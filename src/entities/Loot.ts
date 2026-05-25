import Phaser from 'phaser'

export type LootType = 'coin' | 'gem'

export class Loot extends Phaser.Physics.Arcade.Sprite {
  readonly value: number

  constructor(scene: Phaser.Scene, x: number, y: number, type: LootType = 'coin') {
    super(scene, x, y, type === 'gem' ? 'loot_gem' : 'loot_coin')
    scene.add.existing(this)
    scene.physics.add.existing(this, true)
    this.setDepth(3)
    this.value = type === 'gem' ? 50 : 10

    scene.tweens.add({
      targets: this,
      y: y - 5,
      duration: 900,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    })
  }
}
