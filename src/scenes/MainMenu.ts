import Phaser from 'phaser'
import { SaveManager } from '../systems/SaveManager'

export class MainMenu extends Phaser.Scene {
  constructor() { super('MainMenu') }

  create() {
    const { width, height } = this.scale

    // Particle rain — 14 small squares falling from top to bottom
    const particleColors = [0x00ffcc, 0x334455, 0x445566, 0x002233]
    for (let i = 0; i < 14; i++) {
      const gfx = this.add.graphics().setDepth(0)
      const color = particleColors[i % particleColors.length]
      gfx.fillStyle(color, 0.7)
      gfx.fillRect(0, 0, 4, 4)
      const startX = Math.random() * width
      const startY = Math.random() * height
      gfx.setPosition(startX, -8)
      const duration = 1800 + Math.random() * 1400
      const fall = () => {
        gfx.setPosition(startX, -8)
        this.tweens.add({
          targets: gfx, y: height + 8, duration,
          ease: 'Linear', onComplete: fall,
        })
      }
      this.tweens.add({
        targets: gfx, y: height + 8, duration: duration * (1 - startY / height),
        ease: 'Linear', onComplete: fall,
      })
    }

    // Title texts with entrance animation
    const title1 = this.add.text(width / 2, height * 0.20, 'DUNGEON',
      { fontSize: '60px', fontStyle: 'bold', color: '#00ffcc' })
      .setOrigin(0.5).setAlpha(0).setScale(0.8)
    const title2 = this.add.text(width / 2, height * 0.30, 'DESCENT',
      { fontSize: '40px', fontStyle: 'bold', color: '#667788' })
      .setOrigin(0.5).setAlpha(0).setScale(0.8)

    this.tweens.add({ targets: title1, alpha: 1, scaleX: 1, scaleY: 1, duration: 550, ease: 'Back.Out' })
    this.tweens.add({ targets: title2, alpha: 1, scaleX: 1, scaleY: 1, duration: 550, delay: 120, ease: 'Back.Out' })

    // Tagline and returning-player line
    const save = SaveManager.load()
    this.add.text(width / 2, height * 0.38, 'Loot. Fight. Escape.', { fontSize: '16px', color: '#445566' }).setOrigin(0.5)
    if (save.stats.runsCompleted > 0) {
      const runs = save.stats.runsCompleted
      this.add.text(width / 2, height * 0.47,
        `${runs} run${runs === 1 ? '' : 's'} survived`,
        { fontSize: '10px', color: '#334455' }).setOrigin(0.5)
    }

    const play = this.add
      .text(width / 2, height * 0.56, '[ ENTER DUNGEON ]', { fontSize: '28px', color: '#00ffcc' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    play.on('pointerover',  () => play.setColor('#ffffff'))
    play.on('pointerout',   () => play.setColor('#00ffcc'))
    play.on('pointerdown',  () => this.scene.start('LobbyScene'))

    const daily = this.add
      .text(width / 2, height * 0.63, '[ DAILY CHALLENGE ]', { fontSize: '18px', color: '#ffcc00' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    daily.on('pointerover',  () => daily.setColor('#ffffff'))
    daily.on('pointerout',   () => daily.setColor('#ffcc00'))
    daily.on('pointerdown',  () => this.scene.start('DailyChallengeScene'))

    const settings = this.add
      .text(width / 2, height * 0.72, '[ SETTINGS ]', { fontSize: '18px', color: '#445566' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    settings.on('pointerover',  () => settings.setColor('#aaaaaa'))
    settings.on('pointerout',   () => settings.setColor('#445566'))
    settings.on('pointerdown',  () => this.scene.start('Settings'))

    this.add.text(width / 2, height * 0.90,
      'WASD/Arrows Move  SPACE Attack  Q Roll  F Swap  I Inventory  E Shop',
      { fontSize: '8px', color: '#2a3a4a' }).setOrigin(0.5)

    // Version tag
    this.add.text(width - 6, height - 6, 'v0.1', { fontSize: '7px', color: '#1a2a2a' }).setOrigin(1, 1)
  }
}
