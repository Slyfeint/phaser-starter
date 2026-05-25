import Phaser from 'phaser'
import { BINDINGS, getKey, setKey } from '../systems/KeyBindings'

export class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings') }

  create() {
    const { width, height } = this.scale

    this.add.text(width / 2, height * 0.10, 'SETTINGS', {
      fontSize: '38px', fontStyle: 'bold', color: '#00ffcc',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.19, 'Click a key to rebind', {
      fontSize: '13px', color: '#445566',
    }).setOrigin(0.5)

    BINDINGS.forEach((b, i) => {
      const y = height * 0.27 + i * 36

      this.add.text(width * 0.26, y, b.action, {
        fontSize: '15px', color: '#778899',
      }).setOrigin(0, 0.5)

      const currentKey = getKey(b.id, b.default)
      const btn = this.add
        .text(width * 0.72, y, `[ ${currentKey} ]`, { fontSize: '15px', color: '#00ffcc' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })

      btn
        .on('pointerover',  () => btn.setColor('#ffffff'))
        .on('pointerout',   () => btn.setColor('#00ffcc'))
        .on('pointerdown',  () => this.startRebind(btn, b.id))
    })

    const back = this.add
      .text(width / 2, height * 0.90, '[ BACK ]', { fontSize: '22px', color: '#556677' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    back
      .on('pointerover',  () => back.setColor('#ffffff'))
      .on('pointerout',   () => back.setColor('#556677'))
      .on('pointerdown',  () => this.scene.start('MainMenu'))
  }

  private startRebind(btn: Phaser.GameObjects.Text, id: string) {
    btn.setText('[ press key... ]').setColor('#ffff00')
    this.input.keyboard!.once('keydown', (e: KeyboardEvent) => {
      e.preventDefault()
      const raw = e.code
      const display = raw
        .replace('Key', '')
        .replace('Digit', '')
        .replace('Space', 'SPACE')
        .replace('ShiftLeft', 'SHIFT').replace('ShiftRight', 'SHIFT')
        .replace('ControlLeft', 'CTRL').replace('ControlRight', 'CTRL')
        .replace('AltLeft', 'ALT').replace('AltRight', 'ALT')
      setKey(id, display)
      btn.setText(`[ ${display} ]`).setColor('#00ffcc')
    })
  }
}
