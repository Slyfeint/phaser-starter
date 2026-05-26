import Phaser from 'phaser'
import { SaveManager } from '../systems/SaveManager'
import { QUESTS } from '../systems/QuestDefs'

export class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene') }

  create() {
    const { width, height } = this.scale

    // Dim overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.78)
      .setOrigin(0).setScrollFactor(0).setDepth(100)

    this.add.text(width / 2, height * 0.18, 'PAUSED', {
      fontSize: '44px', fontStyle: 'bold', color: '#00ffcc',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

    this.add.text(width / 2, height * 0.27, 'ESC to resume', {
      fontSize: '11px', color: '#334455',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101)

    // Quest progress panel
    const save = SaveManager.load()
    const panelX = width / 2 - 150, panelY = height * 0.32, panelW = 300, panelH = 82
    this.add.rectangle(panelX, panelY, panelW, panelH, 0x060f0a, 0.9)
      .setOrigin(0).setScrollFactor(0).setDepth(101).setStrokeStyle(1, 0x1a2a1a)
    this.add.text(panelX + panelW / 2, panelY + 4, 'QUESTS', { fontSize: '10px', fontStyle: 'bold', color: '#336633' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(102)
    const activeQuests = save.quests?.active ?? []
    activeQuests.slice(0, 3).forEach((qid, i) => {
      const def = QUESTS.find(q => q.id === qid)
      if (!def) return
      const prog = save.quests?.progress[qid] ?? 0
      const qy = panelY + 18 + i * 20
      this.add.text(panelX + 6, qy, `${def.title}: ${prog}/${def.target}  +${def.reward}g`, {
        fontSize: '10px', color: prog >= def.target ? '#44cc44' : '#446644',
      }).setScrollFactor(0).setDepth(102)
      // Progress bar
      this.add.rectangle(panelX + panelW - 60, qy + 5, 52, 5, 0x1a2a1a).setOrigin(0).setScrollFactor(0).setDepth(102)
      const pct = Math.min(1, prog / def.target)
      if (pct > 0) this.add.rectangle(panelX + panelW - 60, qy + 5, Math.round(52 * pct), 5, 0x44cc44).setOrigin(0).setScrollFactor(0).setDepth(103)
    })

    const makeBtn = (y: number, label: string) =>
      this.add
        .text(width / 2, y, label, { fontSize: '20px', color: '#aabbcc' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(101)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff') })
        .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#aabbcc') })

    const resume = makeBtn(height * 0.56, '[ RESUME ]')
    resume.on('pointerdown', () => this.doResume())

    const settings = makeBtn(height * 0.65, '[ SETTINGS ]')
    settings.on('pointerdown', () => {
      this.scene.stop('PauseScene')
      this.scene.stop('DungeonScene')
      this.scene.start('Settings')
    })

    const menu = makeBtn(height * 0.74, '[ MAIN MENU ]')
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
