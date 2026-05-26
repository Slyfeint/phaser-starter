import Phaser from 'phaser'

export type EventRoomType = 'shrine' | 'cursed_chest' | 'challenge' | 'sacrifice_shrine' | 'memory_echo'

interface EventConfig {
  title: string
  desc: string
  choices: Array<{ label: string; key: string }>
  declineLabel: string
}

const EVENTS: Record<EventRoomType, EventConfig> = {
  shrine: {
    title: 'SHRINE OF POWER',
    desc: 'Ancient magic pulses here.\nPay 80 gold for a blessing.',
    choices: [
      { label: '+20 Max HP',     key: 'hp'     },
      { label: '+10% Damage',    key: 'damage'  },
      { label: '+15% Speed',     key: 'speed'   },
    ],
    declineLabel: '[ Leave ]',
  },
  cursed_chest: {
    title: 'CURSED CHEST',
    desc: 'An epic item awaits — but\na curse will bind you.',
    choices: [
      { label: 'Open Chest', key: 'open' },
    ],
    declineLabel: '[ Walk Away ]',
  },
  challenge: {
    title: 'CHALLENGE ROOM',
    desc: 'Survive the onslaught!\nDefeat all enemies for a reward.',
    choices: [
      { label: 'Accept Challenge', key: 'accept' },
    ],
    declineLabel: '[ Flee ]',
  },
  sacrifice_shrine: {
    title: 'SACRIFICE SHRINE',
    desc: 'Destroy an equipped item\nfor permanent power this run.',
    choices: [],
    declineLabel: '[ Leave ]',
  },
  memory_echo: {
    title: 'MEMORY ECHO',
    desc: 'Defeat the spectral enemies\nfor a rare reward.',
    choices: [
      { label: 'Fight', key: 'fight' },
    ],
    declineLabel: '[ Leave ]',
  },
}

export class EventRoomUI {
  private objects: Phaser.GameObjects.GameObject[] = []
  private _open = false

  isOpen(): boolean { return this._open }

  show(
    scene: Phaser.Scene,
    type: EventRoomType,
    playerGold: number,
    onChoice: (key: string) => void,
    onDecline: () => void,
  ) {
    if (this._open) return
    this._open = true

    const W = scene.scale.width
    const cfg = EVENTS[type]
    const panW = 400, panH = 240
    const px = Math.floor((W - panW) / 2)
    const py = Math.floor((scene.scale.height - panH) / 2)

    const overlay = scene.add.rectangle(0, 0, W, scene.scale.height, 0x000000, 0.55)
      .setOrigin(0).setScrollFactor(0).setDepth(100)
    const panel = scene.add.rectangle(px, py, panW, panH, 0x0a1828)
      .setOrigin(0).setScrollFactor(0).setDepth(101)
      .setStrokeStyle(2, 0x00ffcc)

    const titleTxt = scene.add.text(px + panW / 2, py + 14, cfg.title, {
      fontSize: '16px', fontStyle: 'bold', color: '#00ffcc',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(102)

    const descTxt = scene.add.text(px + panW / 2, py + 38, cfg.desc, {
      fontSize: '11px', color: '#8899aa', align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(102)

    this.objects.push(overlay, panel, titleTxt, descTxt)

    const btnStartY = py + 110
    const btnW = 160, btnH = 34
    const canAffordShrine = type !== 'shrine' || playerGold >= 80

    cfg.choices.forEach((choice, i) => {
      const bx = px + panW / 2 - (cfg.choices.length === 3 ? panW / 2 - 20 + i * 130 : btnW / 2)
      const affordable = type !== 'shrine' || choice.key === 'open' || canAffordShrine
      const bg = scene.add.rectangle(
        type === 'shrine' && cfg.choices.length === 3
          ? px + 20 + i * 127 : px + panW / 2 - btnW / 2,
        btnStartY, type === 'shrine' ? 120 : btnW, btnH,
        affordable ? 0x003322 : 0x111111,
      ).setOrigin(0).setScrollFactor(0).setDepth(102).setStrokeStyle(1, affordable ? 0x00aa88 : 0x334455)
      void bx

      const bLabel = scene.add.text(
        bg.x + (type === 'shrine' ? 60 : btnW / 2), btnStartY + btnH / 2,
        type === 'shrine' ? choice.label + (choice.key !== 'open' ? '\n80g' : '') : choice.label,
        { fontSize: '11px', fontStyle: 'bold', color: affordable ? '#00ffcc' : '#334455', align: 'center' },
      ).setOrigin(0.5).setScrollFactor(0).setDepth(103)
      this.objects.push(bg, bLabel)

      if (affordable) {
        bg.setInteractive({ useHandCursor: true })
        bg.on('pointerover', () => bg.setFillStyle(0x004433))
        bg.on('pointerout',  () => bg.setFillStyle(0x003322))
        bg.on('pointerdown', () => { this.hide(); onChoice(choice.key) })
      }
    })

    const declineY = btnStartY + btnH + 16
    const declineTxt = scene.add.text(px + panW / 2, declineY, cfg.declineLabel, {
      fontSize: '13px', color: '#445566',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(102).setInteractive({ useHandCursor: true })
    declineTxt.on('pointerover', () => declineTxt.setColor('#aaaaaa'))
    declineTxt.on('pointerout',  () => declineTxt.setColor('#445566'))
    declineTxt.on('pointerdown', () => { this.hide(); onDecline() })
    this.objects.push(declineTxt)
  }

  hide() {
    for (const obj of this.objects) { if (obj.active) obj.destroy() }
    this.objects = []
    this._open = false
  }
}
