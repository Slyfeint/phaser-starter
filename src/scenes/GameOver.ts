import Phaser from 'phaser'

interface GameOverData {
  score: number
  victory: boolean
}

export class GameOver extends Phaser.Scene {
  constructor() { super('GameOver') }

  init(data: GameOverData) {
    const { width, height } = this.scale
    const win = data.victory ?? false

    this.add.text(width / 2, height * 0.28, win ? 'ESCAPED!' : 'YOU DIED', {
      fontSize: '52px', fontStyle: 'bold',
      color: win ? '#00ffcc' : '#ff3333',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.42, `Loot Collected: ${data.score}`, {
      fontSize: '26px', color: '#ffd700',
    }).setOrigin(0.5)

    if (!win) {
      this.add.text(width / 2, height * 0.51, 'Find the teal portal to escape', {
        fontSize: '15px', color: '#556677',
      }).setOrigin(0.5)
    }

    const retry = this.add
      .text(width / 2, height * 0.62, '[ ENTER DUNGEON ]', {
        fontSize: '26px', color: '#00ffcc',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    retry
      .on('pointerover', () => retry.setColor('#ffffff'))
      .on('pointerout', () => retry.setColor('#00ffcc'))
      .on('pointerdown', () => this.scene.start('DungeonScene'))

    const menu = this.add
      .text(width / 2, height * 0.72, '[ MAIN MENU ]', {
        fontSize: '20px', color: '#556677',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    menu
      .on('pointerover', () => menu.setColor('#ffffff'))
      .on('pointerout', () => menu.setColor('#556677'))
      .on('pointerdown', () => this.scene.start('MainMenu'))
  }

  create() {}
}
