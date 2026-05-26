import Phaser from 'phaser'

interface GameOverData {
  score: number
  victory: boolean
  floor?: number
  theme?: string
  enemiesKilled?: number
}

export class GameOver extends Phaser.Scene {
  private runData!: GameOverData

  constructor() { super('GameOver') }

  init(data: GameOverData) {
    this.runData = data
  }

  create() {
    const { width, height } = this.scale
    const data = this.runData
    const win = data.victory ?? false
    const floor = data.floor ?? 1
    const theme = data.theme ?? 'dungeon'
    const themeName = ({ dungeon: 'Dungeon', castle: 'Castle', caves: 'Caves' })[theme] ?? theme

    this.add.text(width / 2, height * 0.22, win ? 'ESCAPED!' : 'YOU DIED', {
      fontSize: '52px', fontStyle: 'bold',
      color: win ? '#00ffcc' : '#ff3333',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.34, `Gold: ${data.score}`, {
      fontSize: '22px', color: '#ffd700',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.41, `Enemies slain: ${data.enemiesKilled ?? 0}`, {
      fontSize: '16px', color: '#cc4444',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.48, `${themeName} — Floor ${floor}`, {
      fontSize: '14px', color: '#445566',
    }).setOrigin(0.5)

    if (win) {
      this.add.text(width / 2, height * 0.54, 'Gear and gold saved!', {
        fontSize: '12px', color: '#00cc88',
      }).setOrigin(0.5)
    } else {
      this.add.text(width / 2, height * 0.54, 'Bag lost. Equipped gear kept. 25% gold saved.', {
        fontSize: '10px', color: '#883333',
      }).setOrigin(0.5)
    }

    const retry = this.add
      .text(width / 2, height * 0.64, '[ PLAY AGAIN ]', { fontSize: '26px', color: '#00ffcc' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    retry.on('pointerover', () => retry.setColor('#ffffff'))
    retry.on('pointerout',  () => retry.setColor('#00ffcc'))
    retry.on('pointerdown', () => {
      retry.disableInteractive()
      this.registry.set('currentFloor', 1)
      this.registry.remove('runState')
      this.scene.start('LobbyScene')
    })

    const menu = this.add
      .text(width / 2, height * 0.74, '[ MAIN MENU ]', { fontSize: '18px', color: '#445566' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    menu.on('pointerover', () => menu.setColor('#aaaaaa'))
    menu.on('pointerout',  () => menu.setColor('#445566'))
    menu.on('pointerdown', () => {
      menu.disableInteractive()
      this.scene.start('MainMenu')
    })
  }
}
