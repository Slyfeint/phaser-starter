import Phaser from 'phaser'

export class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu')
  }

  create() {
    const { width, height } = this.scale

    this.add
      .text(width / 2, height * 0.35, 'MY GAME', {
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    const playBtn = this.add
      .text(width / 2, height * 0.55, '[ PLAY ]', {
        fontSize: '30px',
        color: '#00ff88',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    playBtn
      .on('pointerover', () => playBtn.setColor('#ffffff'))
      .on('pointerout', () => playBtn.setColor('#00ff88'))
      .on('pointerdown', () => this.scene.start('GameScene'))
  }
}
