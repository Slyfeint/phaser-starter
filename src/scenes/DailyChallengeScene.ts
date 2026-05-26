import Phaser from 'phaser'
import { RUN_MODIFIERS } from '../systems/RunModifierDefs'

interface DailyScore {
  score: number
  floor: number
}

function getTodayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function getDateSeed(): number {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

function getDailyScores(dateKey: string): DailyScore[] {
  try {
    const raw = localStorage.getItem(`dd_daily_${dateKey}`)
    if (!raw) return []
    return JSON.parse(raw) as DailyScore[]
  } catch {
    return []
  }
}

export function saveDailyScore(score: number, floor: number): boolean {
  const key = getTodayKey()
  const scores = getDailyScores(key)
  const best = scores[0]?.score ?? 0
  const isNew = score > best
  scores.push({ score, floor })
  scores.sort((a, b) => b.score - a.score)
  try {
    localStorage.setItem(`dd_daily_${key}`, JSON.stringify(scores.slice(0, 10)))
  } catch { /* */ }
  return isNew
}

export class DailyChallengeScene extends Phaser.Scene {
  constructor() { super('DailyChallengeScene') }

  create() {
    const { width, height } = this.scale
    const p = 10

    this.add.rectangle(0, 0, width, height, 0x000810).setOrigin(0)

    const today = new Date()
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const dateStr = `${monthNames[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`
    const seed = getDateSeed()
    const mod = RUN_MODIFIERS[seed % RUN_MODIFIERS.length]

    this.add.text(width / 2, 24, 'DAILY CHALLENGE', {
      fontSize: '24px', fontStyle: 'bold', color: '#ffcc00',
    }).setOrigin(0.5, 0)
    this.add.text(width / 2, 54, dateStr, {
      fontSize: '14px', color: '#445566',
    }).setOrigin(0.5, 0)

    this.add.text(width / 2, 84, `TODAY'S SEED: #${seed}`, {
      fontSize: '12px', color: '#336655',
    }).setOrigin(0.5, 0)

    // Modifier panel
    const modY = 110
    this.add.rectangle(p, modY, width - p * 2, 70, 0x0a1520).setOrigin(0).setStrokeStyle(1, 0x334455)
    this.add.text(width / 2, modY + 8, "TODAY'S MODIFIER", {
      fontSize: '10px', color: '#445566',
    }).setOrigin(0.5, 0)
    this.add.text(width / 2, modY + 22, `${mod.icon}  ${mod.title}`, {
      fontSize: '15px', fontStyle: 'bold', color: '#ffcc44',
    }).setOrigin(0.5, 0)
    this.add.text(width / 2, modY + 42, mod.desc, {
      fontSize: '9px', color: '#889988', wordWrap: { width: width - p * 4 }, align: 'center',
    }).setOrigin(0.5, 0)

    // Top 3 leaderboard
    const lbY = 192
    this.add.text(width / 2, lbY, 'LOCAL BEST SCORES', {
      fontSize: '11px', fontStyle: 'bold', color: '#445566',
    }).setOrigin(0.5, 0)

    const scores = getDailyScores(getTodayKey())
    const top3 = scores.slice(0, 3)
    if (top3.length === 0) {
      this.add.text(width / 2, lbY + 18, 'No scores yet — be the first!', {
        fontSize: '10px', color: '#2a3a4a',
      }).setOrigin(0.5, 0)
    } else {
      top3.forEach((s, i) => {
        const rankColors = ['#ffd700', '#cccccc', '#cc8844']
        this.add.text(width / 2, lbY + 18 + i * 22,
          `#${i + 1}  Gold: ${s.score}  |  Floor ${s.floor}`, {
          fontSize: '12px', color: rankColors[i] ?? '#445566',
        }).setOrigin(0.5, 0)
      })
    }

    // Start button
    const startY = lbY + 90
    const startBtn = this.add.text(width / 2, startY, '[ START CHALLENGE ]', {
      fontSize: '22px', fontStyle: 'bold', color: '#00ffcc',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
    startBtn.on('pointerover', () => startBtn.setColor('#ffffff'))
    startBtn.on('pointerout',  () => startBtn.setColor('#00ffcc'))
    startBtn.on('pointerdown', () => {
      startBtn.disableInteractive()
      this.registry.set('currentFloor', 1)
      this.registry.remove('runState')
      this.registry.set('mapTheme', 'dungeon')
      this.registry.set('runChallenges', [])
      this.registry.set('runChallengeGoldBonus', 0)
      this.registry.set('dailyChallengeActive', true)
      this.registry.set('dailyChallengeDate', getTodayKey())
      this.registry.set('runModifier', mod.id)
      this.scene.start('DungeonScene')
    })

    // Back button
    const backBtn = this.add.text(width / 2, startY + 48, '[ BACK ]', {
      fontSize: '16px', color: '#445566',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
    backBtn.on('pointerover', () => backBtn.setColor('#aaaaaa'))
    backBtn.on('pointerout',  () => backBtn.setColor('#445566'))
    backBtn.on('pointerdown', () => this.scene.start('MainMenu'))
  }
}
