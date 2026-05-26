import Phaser from 'phaser'
import { ACHIEVEMENTS } from '../systems/AchievementDefs'
import { SaveManager } from '../systems/SaveManager'
import { AdManager } from '../systems/AdManager'
import { checkPostRunUnlocks } from '../systems/UnlockTracker'

interface GameOverData {
  score: number
  victory: boolean
  floor?: number
  theme?: string
  enemiesKilled?: number
  newAchievements?: string[]
  challengeBonus?: number
  damageDealt?: number
  topWeapon?: string
  consumablesUsed?: number
  killedBy?: string
}

const TIPS = [
  'Tip: Rolling grants invincibility frames — dodge through attacks',
  'Tip: Crits deal double damage. Stack crit chance for big runs',
  'Tip: Shop items scale with floor — save gold for floor 2',
  'Tip: Bag items are lost on death — keep healing items in your hotbar',
  'Tip: Challenge modifiers pay out bonus gold only on victory',
  'Tip: The Shadow cosmetic grants +20 speed — great for kiting',
]

export class GameOver extends Phaser.Scene {
  private runData!: GameOverData
  private _doubleGoldUsed = false

  constructor() { super('GameOver') }

  init(data: GameOverData) {
    this.runData = data
    this._doubleGoldUsed = false
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

    // Score display (with reference for double gold)
    const scoreText = this.add.text(width / 2, height * 0.34, `Gold: ${data.score}`, {
      fontSize: '22px', color: '#ffd700',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.41, `Enemies slain: ${data.enemiesKilled ?? 0}`, {
      fontSize: '16px', color: '#cc4444',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.48, `${themeName} — Floor ${floor}`, {
      fontSize: '14px', color: '#445566',
    }).setOrigin(0.5)

    let extraY = height * 0.54

    if (win) {
      this.add.text(width / 2, extraY, 'Gear and gold saved!', {
        fontSize: '12px', color: '#00cc88',
      }).setOrigin(0.5)
      extraY += 22
    } else {
      // Killed by display
      if (data.killedBy) {
        this.add.text(width / 2, extraY, `Killed by: ${data.killedBy}`, {
          fontSize: '13px', fontStyle: 'bold', color: '#ff4444',
        }).setOrigin(0.5)
        extraY += 18
      }
      this.add.text(width / 2, extraY, 'Bag lost. Equipped gear kept. 25% gold saved.', {
        fontSize: '10px', color: '#883333',
      }).setOrigin(0.5)
      extraY += 18
    }

    // Challenge bonus
    const chalBonus = data.challengeBonus ?? 0
    if (chalBonus > 0 && win) {
      this.add.text(width / 2, extraY, `Challenge Bonus: +${chalBonus}g`, {
        fontSize: '13px', fontStyle: 'bold', color: '#88ff44',
      }).setOrigin(0.5)
      extraY += 22
    }

    // Victory: Run Summary
    if (win) {
      this.add.text(width / 2, extraY, 'RUN SUMMARY', {
        fontSize: '13px', fontStyle: 'bold', color: '#aaffcc',
      }).setOrigin(0.5)
      extraY += 18
      if (data.damageDealt !== undefined) {
        this.add.text(width / 2, extraY, `Damage Dealt: ${Math.round(data.damageDealt)}`, {
          fontSize: '11px', color: '#ff8855',
        }).setOrigin(0.5)
        extraY += 16
      }
      if (data.topWeapon) {
        this.add.text(width / 2, extraY, `Top Weapon: ${data.topWeapon}`, {
          fontSize: '11px', color: '#aaccff',
        }).setOrigin(0.5)
        extraY += 16
      }
      if (data.consumablesUsed !== undefined) {
        this.add.text(width / 2, extraY, `Consumables Used: ${data.consumablesUsed}`, {
          fontSize: '11px', color: '#99ccaa',
        }).setOrigin(0.5)
        extraY += 16
      }
      extraY += 4

      // Gold scatter effect
      this.spawnGoldScatter(width, height)
    }

    // Achievement unlocks
    const newAch = data.newAchievements ?? []
    if (newAch.length > 0) {
      this.add.text(width / 2, extraY, 'ACHIEVEMENTS UNLOCKED!', {
        fontSize: '12px', fontStyle: 'bold', color: '#ffcc00',
      }).setOrigin(0.5)
      extraY += 18
      newAch.forEach(id => {
        const def = ACHIEVEMENTS.find(a => a.id === id)
        if (!def) return
        const achTxt = this.add.text(width / 2, extraY, `★ ${def.title}: ${def.unlockLabel}`, {
          fontSize: '11px', color: '#ffaa00',
        }).setOrigin(0.5).setAlpha(0)
        this.tweens.add({ targets: achTxt, alpha: 1, duration: 600, delay: 300 })
        extraY += 18
      })
    }

    // Post-run unlock notifications
    const save = SaveManager.load()
    const unlocks = checkPostRunUnlocks(save.killStats.runsCompleted, save.killStats.totalKills)
    if (unlocks.length > 0) {
      extraY += 6
      const unlockHeader = this.add.text(width / 2, extraY, 'NEW UNLOCK', {
        fontSize: '13px', fontStyle: 'bold', color: '#ffd700',
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({ targets: unlockHeader, alpha: 1, duration: 600, delay: 400 })
      extraY += 18
      unlocks.forEach((u, idx) => {
        const uTitle = this.add.text(width / 2, extraY, u.title, {
          fontSize: '11px', fontStyle: 'bold', color: '#ffcc55',
        }).setOrigin(0.5).setAlpha(0)
        const uDesc = this.add.text(width / 2, extraY + 14, u.desc, {
          fontSize: '9px', color: '#aa9944',
        }).setOrigin(0.5).setAlpha(0)
        this.tweens.add({ targets: uTitle, alpha: 1, duration: 600, delay: 700 + idx * 500 })
        this.tweens.add({ targets: uDesc,  alpha: 1, duration: 600, delay: 800 + idx * 500 })
        extraY += 30
      })
    }

    const buttonsBaseY = Math.max(extraY + 4, height * 0.72)

    // Double gold button (victory only)
    let doubleGoldBtnY = buttonsBaseY
    if (win && !this._doubleGoldUsed) {
      const doubleBtn = this.add
        .text(width / 2, doubleGoldBtnY, '[ DOUBLE GOLD ]', { fontSize: '20px', color: '#ffd700' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true })
      doubleBtn.on('pointerover', () => doubleBtn.setColor('#ffffff'))
      doubleBtn.on('pointerout',  () => doubleBtn.setColor('#ffd700'))
      doubleBtn.on('pointerdown', () => {
        if (this._doubleGoldUsed) return
        doubleBtn.disableInteractive()
        doubleBtn.setColor('#665500')
        AdManager.requestAd('double_gold').then(reward => {
          if (reward.granted) {
            this._doubleGoldUsed = true
            const bonusGold = data.score
            data.score += bonusGold
            scoreText.setText(`Gold: ${data.score}`)
            doubleBtn.setText(`+${bonusGold}g bonus!`)
            doubleBtn.setColor('#00ff88')
            // Save extra gold
            const s = SaveManager.load()
            s.gold += bonusGold
            SaveManager.save(s)
            this.time.delayedCall(2000, () => { if (doubleBtn.active) doubleBtn.destroy() })
          } else {
            doubleBtn.setInteractive({ useHandCursor: true })
            doubleBtn.setColor('#ffd700')
          }
        })
      })
      doubleGoldBtnY += 36
    }

    const retryY = Math.max(doubleGoldBtnY + 4, height * 0.78)
    const retry = this.add
      .text(width / 2, retryY, '[ PLAY AGAIN ]', { fontSize: '26px', color: '#00ffcc' })
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
      .text(width / 2, Math.max(retryY + 38, height * 0.88), '[ MAIN MENU ]', { fontSize: '18px', color: '#445566' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    menu.on('pointerover', () => menu.setColor('#aaaaaa'))
    menu.on('pointerout',  () => menu.setColor('#445566'))
    menu.on('pointerdown', () => {
      menu.disableInteractive()
      this.scene.start('MainMenu')
    })

    // Death tip
    if (!win) {
      const tip = TIPS[Math.floor(Math.random() * TIPS.length)]
      this.add.text(width / 2, height - 20, tip, {
        fontSize: '9px', fontStyle: 'italic', color: '#334455',
        wordWrap: { width: width - 24 }, align: 'center',
      }).setOrigin(0.5, 1)
    }
  }

  private spawnGoldScatter(width: number, height: number) {
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const circle = this.add.circle(x, y, 5 + Math.random() * 4, 0xffd700).setDepth(5).setAlpha(0.9)
      this.tweens.add({
        targets: circle,
        alpha: 0,
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        duration: 1200,
        delay: Math.random() * 400,
        ease: 'Cubic.Out',
        onComplete: () => circle.destroy(),
      })
    }
  }
}
