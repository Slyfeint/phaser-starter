import Phaser from 'phaser'
import { Boot } from './scenes/Boot'
import { Preload } from './scenes/Preload'
import { MainMenu } from './scenes/MainMenu'
import { LobbyScene } from './scenes/LobbyScene'
import { DungeonScene } from './scenes/DungeonScene'
import { GameOver } from './scenes/GameOver'
import { SettingsScene } from './scenes/SettingsScene'
import { PauseScene } from './scenes/PauseScene'
import { SkillScene } from './scenes/SkillScene'
import { MarketplaceScene } from './scenes/MarketplaceScene'
import { DailyChallengeScene } from './scenes/DailyChallengeScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 480,
  height: 854,
  backgroundColor: '#000000',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [Boot, Preload, MainMenu, LobbyScene, DungeonScene, GameOver, SettingsScene, PauseScene, SkillScene, MarketplaceScene, DailyChallengeScene],
}

const game = new Phaser.Game(config)

game.events.once('ready', () => {
  document.body.style.touchAction = 'none'
  const stored = parseFloat(localStorage.getItem('ui_zoom') ?? '')
  const zoom = isNaN(stored) ? Math.min(window.innerWidth / 480, window.innerHeight / 854) : stored
  applyCanvasZoom(zoom)
})

export function applyCanvasZoom(zoom: number) {
  const clamped = Math.max(0.25, Math.min(3.0, zoom))
  const canvas = game.canvas
  canvas.style.width = `${Math.round(480 * clamped)}px`
  canvas.style.height = `${Math.round(854 * clamped)}px`
  localStorage.setItem('ui_zoom', String(clamped))
}
