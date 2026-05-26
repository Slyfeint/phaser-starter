import Phaser from 'phaser'

export class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene') }

  create() {
    const { width, height } = this.scale

    // Dim overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.78)
      .setOrigin(0).setScrollFactor(0).setDepth(100)

    this.add.text(width / 2, height * 0.28, 'PAUSED', {
      fontSize: '44px', fontStyle: 'bold', color: '#00ffcc',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

    this.add.text(width / 2, height * 0.38, 'ESC to resume', {
      fontSize: '11px', color: '#334455',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

    const makeBtn = (y: number, label: string) =>
      this.add
        .text(width / 2, y, label, { fontSize: '20px', color: '#aabbcc' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(101)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff') })
        .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#aabbcc') })

    const resume = makeBtn(height * 0.48, '[ RESUME ]')
    resume.on('pointerdown', () => this.doResume())

    const settings = makeBtn(height * 0.58, '[ SETTINGS ]')
    settings.on('pointerdown', () => {
      this.scene.stop('PauseScene')
      this.scene.stop('DungeonScene')
      this.scene.start('Settings')
    })

    const menu = makeBtn(height * 0.68, '[ MAIN MENU ]')
    menu.on('pointerdown', () => {
      this.scene.stop('PauseScene')
      this.scene.stop('DungeonScene')
      this.scene.start('MainMenu')
    })

    this.input.keyboard!.on('keydown-ESC', () => this.doResume())
  }

  private doResume() {
    this.scene.resume('DungeonScene')
    this.scene.stop()
  }
}
