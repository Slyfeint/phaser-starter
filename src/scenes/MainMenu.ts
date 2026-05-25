import Phaser from 'phaser'

export class MainMenu extends Phaser.Scene {
  constructor() { super('MainMenu') }

  create() {
    const { width, height } = this.scale

    this.add.text(width / 2, height * 0.28, 'DUNGEON', {
      fontSize: '60px', fontStyle: 'bold', color: '#00ffcc',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.37, 'DESCENT', {
      fontSize: '40px', fontStyle: 'bold', color: '#667788',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.5, 'Loot. Fight. Escape.', {
      fontSize: '18px', color: '#445566',
    }).setOrigin(0.5)

    const play = this.add
      .text(width / 2, height * 0.62, '[ ENTER DUNGEON ]', {
        fontSize: '28px', color: '#00ffcc',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    play
      .on('pointerover', () => play.setColor('#ffffff'))
      .on('pointerout', () => play.setColor('#00ffcc'))
      .on('pointerdown', () => this.scene.start('DungeonScene'))
  }
}
