import Phaser from 'phaser'
import { BINDINGS, getKey, setKey } from '../systems/KeyBindings'
import { applyCanvasZoom } from '../main'

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

    // ── Zoom / display section ──
    const zoomSectionY = height * 0.27 + BINDINGS.length * 36 + 18
    this.add.rectangle(width / 2, zoomSectionY, width * 0.7, 1, 0x224433).setOrigin(0.5, 0)
    this.add.text(width / 2, zoomSectionY + 10, 'DISPLAY', {
      fontSize: '11px', color: '#445566',
    }).setOrigin(0.5, 0)

    const stored = parseFloat(localStorage.getItem('ui_zoom') ?? '')
    let zoom = isNaN(stored)
      ? Math.min(window.innerWidth / 480, window.innerHeight / 854)
      : stored

    const zoomRowY = zoomSectionY + 42
    this.add.text(width * 0.26, zoomRowY, 'UI Zoom', {
      fontSize: '15px', color: '#778899',
    }).setOrigin(0, 0.5)

    const zoomLabel = this.add.text(width * 0.72, zoomRowY, `${Math.round(zoom * 100)}%`, {
      fontSize: '15px', color: '#00ffcc',
    }).setOrigin(0.5)

    const adjustZoom = (delta: number) => {
      zoom = Math.max(0.25, Math.min(3.0, Math.round((zoom + delta) * 4) / 4))
      applyCanvasZoom(zoom)
      zoomLabel.setText(`${Math.round(zoom * 100)}%`)
    }

    this.add.text(width * 0.60, zoomRowY, '[ - ]', { fontSize: '15px', color: '#aabbcc' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff') })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#aabbcc') })
      .on('pointerdown', () => adjustZoom(-0.25))

    this.add.text(width * 0.84, zoomRowY, '[ + ]', { fontSize: '15px', color: '#aabbcc' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff') })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#aabbcc') })
      .on('pointerdown', () => adjustZoom(+0.25))

    this.add.text(width / 2, zoomRowY + 22, 'click – or + to resize the game canvas', {
      fontSize: '9px', color: '#334455',
    }).setOrigin(0.5)

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
