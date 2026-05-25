import Phaser from 'phaser'

interface GameOverData {
  score: number
}

export class GameOver extends Phaser.Scene {
  constructor() {
    super('GameOver')
  }

  init(data: GameOverData) {
    const { width, height } = this.scale

    this.add
      .text(width / 2, height * 0.32, 'GAME OVER', {
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ff4444',
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, height * 0.45, `Score: ${data.score}`, {
        fontSize: '30px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    const retryBtn = this.add
      .text(width / 2, height * 0.58, '[ PLAY AGAIN ]', {
        fontSize: '26px',
        color: '#00ff88',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    retryBtn
      .on('pointerover', () => retryBtn.setColor('#ffffff'))
      .on('pointerout', () => retryBtn.setColor('#00ff88'))
      .on('pointerdown', () => this.scene.start('GameScene'))

    const menuBtn = this.add
      .text(width / 2, height * 0.68, '[ MAIN MENU ]', {
        fontSize: '22px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    menuBtn
      .on('pointerover', () => menuBtn.setColor('#ffffff'))
      .on('pointerout', () => menuBtn.setColor('#aaaaaa'))
      .on('pointerdown', () => this.scene.start('MainMenu'))
  }

  create() {}
}
