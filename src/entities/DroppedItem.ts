import Phaser from 'phaser'
import type { ItemDef } from '../systems/ItemDefs'

const RARITY_TINTS = { common: 0xffffff, rare: 0x4488ff, epic: 0xaa44ff }

export class DroppedItem extends Phaser.Physics.Arcade.Sprite {
  readonly itemDef: ItemDef

  constructor(scene: Phaser.Scene, x: number, y: number, item: ItemDef) {
    const key = item.slotType === 'weapon' ? 'icon_weapon' : `icon_${item.slotType}`
    super(scene, x, y, key)
    this.itemDef = item
    scene.add.existing(this)
    scene.physics.add.existing(this, true)
    this.setDepth(2).setScale(1.5).setTint(RARITY_TINTS[item.rarity])

    // Glow pulse
    scene.tweens.add({
      targets: this, alpha: 0.5,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    })
  }
}
