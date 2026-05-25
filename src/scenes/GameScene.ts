import Phaser from 'phaser'

export class GameScene extends Phaser.Scene {
  private score = 0
  private scoreText!: Phaser.GameObjects.Text

  constructor() {
    super('GameScene')
  }

  create() {
    const { width, height } = this.scale
    this.score = 0

    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '22px',
      color: '#ffffff',
    })

    // Placeholder tap/click handler — replace with your game logic
    this.add
      .text(width / 2, height / 2, 'Tap to score!\nESC = Game Over', {
        fontSize: '22px',
        color: '#888888',
        align: 'center',
      })
      .setOrigin(0.5)

    this.input.on('pointerdown', () => {
      this.score += 10
      this.scoreText.setText(`Score: ${this.score}`)
    })

    this.input.keyboard
      ?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      .on('down', () => this.endGame())
  }

  private endGame() {
    this.scene.start('GameOver', { score: this.score })
  }
}
