import Phaser from 'phaser'

export class Preload extends Phaser.Scene {
  constructor() {
    super('Preload')
  }

  preload() {
    const { width, height } = this.scale

    const progressBg = this.add.rectangle(width / 2, height / 2, 300, 20, 0x444444)
    const progressBar = this.add.rectangle(width / 2 - 150, height / 2, 0, 16, 0x00ff88)
    progressBar.setOrigin(0, 0.5)

    this.add
      .text(width / 2, height / 2 - 30, 'Loading...', {
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.load.on('progress', (value: number) => {
      progressBar.width = 300 * value
    })

    this.load.on('complete', () => {
      progressBg.destroy()
      progressBar.destroy()
    })

    // Add your assets here as the game grows:
    // this.load.image('player', 'assets/images/player.png')
    // this.load.spritesheet('explosion', 'assets/images/explosion.png', { frameWidth: 64, frameHeight: 64 })
    // this.load.audio('bgm', 'assets/audio/bgm.mp3')
  }

  create() {
    this.scene.start('MainMenu')
  }
}
