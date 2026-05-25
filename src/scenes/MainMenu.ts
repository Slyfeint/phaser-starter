import Phaser from 'phaser'

const THEMES = ['dungeon', 'castle', 'caves'] as const
const THEME_LABELS: Record<string, string> = { dungeon: 'Dungeon', castle: 'Castle', caves: 'Caves' }

export class MainMenu extends Phaser.Scene {
  constructor() { super('MainMenu') }

  create() {
    const { width, height } = this.scale

    this.add.text(width / 2, height * 0.22, 'DUNGEON', { fontSize: '60px', fontStyle: 'bold', color: '#00ffcc' }).setOrigin(0.5)
    this.add.text(width / 2, height * 0.31, 'DESCENT', { fontSize: '40px', fontStyle: 'bold', color: '#667788' }).setOrigin(0.5)
    this.add.text(width / 2, height * 0.42, 'Loot. Fight. Escape.', { fontSize: '18px', color: '#445566' }).setOrigin(0.5)

    // Theme selector
    this.add.text(width / 2, height * 0.52, 'Map Theme', { fontSize: '13px', color: '#445566' }).setOrigin(0.5)

    let activeTheme = (this.registry.get('mapTheme') as string | undefined) ?? 'dungeon'
    const btns: Phaser.GameObjects.Text[] = []

    THEMES.forEach((theme, i) => {
      const tx = width * 0.22 + i * width * 0.28
      const btn = this.add
        .text(tx, height * 0.585, `[${THEME_LABELS[theme]}]`, {
          fontSize: '15px', color: theme === activeTheme ? '#00ffcc' : '#445566',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })

      btn.on('pointerdown', () => {
        activeTheme = theme
        this.registry.set('mapTheme', theme)
        btns.forEach((b, j) => b.setColor(j === i ? '#00ffcc' : '#445566'))
      })
      btns.push(btn)
    })

    const play = this.add
      .text(width / 2, height * 0.68, '[ ENTER DUNGEON ]', { fontSize: '28px', color: '#00ffcc' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })

    play
      .on('pointerover',  () => play.setColor('#ffffff'))
      .on('pointerout',   () => play.setColor('#00ffcc'))
      .on('pointerdown',  () => this.scene.start('DungeonScene'))

    const settings = this.add
      .text(width / 2, height * 0.78, '[ SETTINGS ]', { fontSize: '18px', color: '#445566' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })

    settings
      .on('pointerover',  () => settings.setColor('#ffffff'))
      .on('pointerout',   () => settings.setColor('#445566'))
      .on('pointerdown',  () => this.scene.start('Settings'))

    this.add.text(width / 2, height * 0.92, 'WASD/Arrows  Move    SPACE  Attack    Q  Roll    F  Swap    I  Inventory', {
      fontSize: '9px', color: '#2a3a4a',
    }).setOrigin(0.5)
  }
}
