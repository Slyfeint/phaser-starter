import Phaser from 'phaser'

interface GameOverData {
  score: number
  victory: boolean
  floor?: number
  theme?: string
}

export class GameOver extends Phaser.Scene {
  constructor() { super('GameOver') }

  init(data: GameOverData) {
    const { width, height } = this.scale
    const win = data.victory ?? false
    const floor = data.floor ?? 1
    const theme = data.theme ?? 'dungeon'
    const themeName = ({ dungeon: 'Dungeon', castle: 'Castle', caves: 'Caves' })[theme] ?? theme

    this.add.text(width / 2, height * 0.22, win ? 'ESCAPED!' : 'YOU DIED', {
      fontSize: '52px', fontStyle: 'bold',
      color: win ? '#00ffcc' : '#ff3333',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.36, `Gold Collected: ${data.score}`, {
      fontSize: '24px', color: '#ffd700',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.44, `${themeName} — Floor ${floor}`, {
      fontSize: '16px', color: '#445566',
    }).setOrigin(0.5)

    if (win) {
      this.add.text(width / 2, height * 0.51, 'Gear and gold saved!', {
        fontSize: '13px', color: '#00cc88',
      }).setOrigin(0.5)
    } else {
      this.add.text(width / 2, height * 0.51, 'Bag lost. Equipped gear kept. 25% gold saved.', {
        fontSize: '11px', color: '#883333',
      }).setOrigin(0.5)
    }

    const retry = this.add
      .text(width / 2, height * 0.63, '[ PLAY AGAIN ]', { fontSize: '26px', color: '#00ffcc' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    retry.on('pointerover', () => retry.setColor('#ffffff'))
    retry.on('pointerout',  () => retry.setColor('#00ffcc'))
    retry.on('pointerdown', () => {
      this.registry.set('currentFloor', 1)
      this.registry.remove('runState')
      this.scene.start('LobbyScene')
    })

    const menu = this.add
      .text(width / 2, height * 0.73, '[ MAIN MENU ]', { fontSize: '18px', color: '#445566' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    menu.on('pointerover', () => menu.setColor('#aaaaaa'))
    menu.on('pointerout',  () => menu.setColor('#445566'))
    menu.on('pointerdown', () => this.scene.start('MainMenu'))
  }

  create() {}
}
