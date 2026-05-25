import Phaser from 'phaser'

export class MainMenu extends Phaser.Scene {
  constructor() { super('MainMenu') }

  create() {
    const { width, height } = this.scale

    this.add.text(width / 2, height * 0.20, 'DUNGEON', { fontSize: '60px', fontStyle: 'bold', color: '#00ffcc' }).setOrigin(0.5)
    this.add.text(width / 2, height * 0.30, 'DESCENT', { fontSize: '40px', fontStyle: 'bold', color: '#667788' }).setOrigin(0.5)
    this.add.text(width / 2, height * 0.41, 'Loot. Fight. Escape.', { fontSize: '16px', color: '#445566' }).setOrigin(0.5)

    const play = this.add
      .text(width / 2, height * 0.56, '[ ENTER DUNGEON ]', { fontSize: '28px', color: '#00ffcc' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    play.on('pointerover',  () => play.setColor('#ffffff'))
    play.on('pointerout',   () => play.setColor('#00ffcc'))
    play.on('pointerdown',  () => this.scene.start('LobbyScene'))

    const settings = this.add
      .text(width / 2, height * 0.68, '[ SETTINGS ]', { fontSize: '18px', color: '#445566' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    settings.on('pointerover',  () => settings.setColor('#aaaaaa'))
    settings.on('pointerout',   () => settings.setColor('#445566'))
    settings.on('pointerdown',  () => this.scene.start('Settings'))

    this.add.text(width / 2, height * 0.90,
      'WASD/Arrows Move  SPACE Attack  Q Roll  F Swap  I Inventory  E Shop',
      { fontSize: '8px', color: '#2a3a4a' }).setOrigin(0.5)
  }
}
