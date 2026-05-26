import Phaser from 'phaser'
import { SaveManager } from '../systems/SaveManager'
import { COSMETICS } from '../systems/Cosmetics'
import { SLOT_ORDER } from '../systems/Inventory'
import type { EquipSlot } from '../systems/ItemDefs'
import { RARITY_COLOR } from '../systems/Rarity'
import { RUN_MODIFIERS } from '../systems/RunModifierDefs'
import { CLASSES } from '../systems/ClassDefs'

const THEMES = ['dungeon', 'castle', 'caves'] as const
type Theme = typeof THEMES[number]
type Difficulty = 'easy' | 'normal' | 'hard'

const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon1: 'WPN 1', weapon2: 'WPN 2',
  helm: 'HELM', chest: 'CHEST', legs: 'LEGS',
  gloves: 'GLOVES', ring: 'RING', necklace: 'NECK',
}

const DIFF_CFG: Record<Difficulty, { label: string; color: string; bg: number; desc: string }> = {
  easy:   { label: 'EASY',   color: '#44cc44', bg: 0x001500, desc: '−30% enemy HP & damage  |  −20% loot' },
  normal: { label: 'NORMAL', color: '#00ffcc', bg: 0x001a11, desc: 'Balanced challenge  |  Standard rewards' },
  hard:   { label: 'HARD',   color: '#ff4444', bg: 0x1a0000, desc: '+50% enemy HP, +25% damage  |  +50% loot' },
}

export class LobbyScene extends Phaser.Scene {
  constructor() { super('LobbyScene') }

  create() {
    const save           = SaveManager.load()
    const W              = this.scale.width   // 480
    const H              = this.scale.height  // 854
    const p              = 8

    this.add.rectangle(0, 0, W, H, 0x000810).setOrigin(0)

    const cosmetic       = COSMETICS.find(c => c.id === save.activeCosmetic) ?? COSMETICS[0]
    const activeDiff     = (save.difficulty ?? 'normal') as Difficulty
    const activeThemeRef = { value: (this.registry.get('mapTheme') as Theme) ?? 'dungeon' }

    // ── Header ──────────────────────────────────────────────────────────────
    this.add.text(W / 2, 13, 'DUNGEON DESCENT',
      { fontSize: '22px', fontStyle: 'bold', color: '#00ffcc' }).setOrigin(0.5, 0)
    this.add.text(W / 2, 39, 'Character Select',
      { fontSize: '13px', color: '#445566' }).setOrigin(0.5, 0)
    this.add.text(W - p, 15, `Gold: ${save.gold}`,
      { fontSize: '14px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(1, 0)

    const skillsBtn = this.add.text(p, 15, '[ SKILLS ]',
      { fontSize: '14px', fontStyle: 'bold', color: '#00cc99' })
      .setInteractive({ useHandCursor: true })
    skillsBtn.on('pointerover', () => skillsBtn.setColor('#ffffff'))
    skillsBtn.on('pointerout',  () => skillsBtn.setColor('#00cc99'))
    skillsBtn.on('pointerdown', () => this.scene.start('SkillScene'))

    const mktBtn = this.add.text(p, 35, '[ MARKET ]',
      { fontSize: '11px', fontStyle: 'bold', color: '#cc9900' })
      .setInteractive({ useHandCursor: true })
    mktBtn.on('pointerover', () => mktBtn.setColor('#ffcc00'))
    mktBtn.on('pointerout',  () => mktBtn.setColor('#cc9900'))
    mktBtn.on('pointerdown', () => this.scene.start('MarketplaceScene'))

    // ── Character Selection ──────────────────────────────────────────────────
    let y = 57
    this.add.text(W / 2, y, 'SELECT CHARACTER',
      { fontSize: '11px', fontStyle: 'bold', color: '#445566' }).setOrigin(0.5, 0)

    y += 14
    const charBoxW = Math.floor((W - p * 2 - 18) / 4)
    const charBoxH = 90
    const classMap = ['knight', 'rogue', 'ranger', 'mage'] as const

    for (let ci = 0; ci < 4; ci++) {
      const bx = p + ci * (charBoxW + 6)
      const by = y
      const cx = bx + charBoxW / 2
      const thisClass = classMap[ci]
      const isActive = thisClass === 'knight'
        ? (save.selectedClass === null || save.selectedClass === undefined)
        : save.selectedClass === thisClass

      if (ci === 0) {
        // Knight
        this.add.rectangle(bx, by, charBoxW, charBoxH, isActive ? 0x002233 : 0x050e1a)
          .setOrigin(0).setStrokeStyle(1, isActive ? 0x00ffcc : 0x0d1f2d)
        const sp = this.add.sprite(cx, by + 34, 'player').setScale(2.0)
        if (cosmetic.tint !== 0xffffff) sp.setTint(cosmetic.tint)
        this.add.text(cx, by + charBoxH - 24, 'Knight',
          { fontSize: '14px', fontStyle: 'bold', color: isActive ? '#00ffcc' : '#334455' }).setOrigin(0.5, 0)
        if (isActive) {
          this.add.text(cx, by + charBoxH - 10, 'ACTIVE',
            { fontSize: '11px', color: '#00cc88' }).setOrigin(0.5, 0)
        }
        const knightBox = this.add.rectangle(bx, by, charBoxW, charBoxH, 0, 0)
          .setOrigin(0).setInteractive({ useHandCursor: true })
        knightBox.on('pointerdown', () => {
          save.selectedClass = null
          SaveManager.save(save)
          this.scene.restart()
        })
      } else {
        const classDef = CLASSES.find(c => c.id === thisClass)
        const classColor = classDef ? parseInt(classDef.color.replace('#', ''), 16) : 0x1a2a3a

        this.add.rectangle(bx, by, charBoxW, charBoxH, isActive ? 0x001122 : 0x050e1a)
          .setOrigin(0).setStrokeStyle(isActive ? 2 : 1, isActive ? classColor : 0x112233)

        this.add.text(cx, by + 10, classDef?.name.toUpperCase() ?? '', {
          fontSize: '12px', fontStyle: 'bold',
          color: isActive ? (classDef?.color ?? '#aaaaaa') : '#1a3344',
        }).setOrigin(0.5, 0)

        this.add.text(cx, by + 26, classDef?.tagline ?? '', {
          fontSize: '6px',
          color: isActive ? '#446655' : '#0d1e2c',
          wordWrap: { width: charBoxW - 8 },
          align: 'center',
        }).setOrigin(0.5, 0)

        if (isActive) {
          this.add.text(cx, by + charBoxH - 12, 'ACTIVE',
            { fontSize: '10px', color: '#00cc88' }).setOrigin(0.5, 0)
        }

        const classBox = this.add.rectangle(bx, by, charBoxW, charBoxH, 0, 0)
          .setOrigin(0).setInteractive({ useHandCursor: true })
        const capturedClass = thisClass as 'rogue' | 'ranger' | 'mage'
        classBox.on('pointerdown', () => {
          save.selectedClass = capturedClass
          SaveManager.save(save)
          this.scene.restart()
        })
      }
    }

    // ── Gear Panels ─────────────────────────────────────────────────────────
    y += charBoxH + 6
    const gearY  = y
    const gearH  = 230
    const leftW  = 108
    const centW  = 158
    const rightW = W - p * 2 - 12 - leftW - centW   // ≈ 186

    // ─ Left: character + stats ─
    this.add.rectangle(p, gearY, leftW, gearH, 0x0a1520).setOrigin(0)
    this.add.text(p + leftW / 2, gearY + 6, 'CHARACTER',
      { fontSize: '11px', fontStyle: 'bold', color: '#445566' }).setOrigin(0.5, 0)

    const sp2 = this.add.sprite(p + leftW / 2, gearY + 46, 'player').setScale(2.2)
    if (cosmetic.tint !== 0xffffff) sp2.setTint(cosmetic.tint)
    this.add.text(p + leftW / 2, gearY + 72, cosmetic.name,
      { fontSize: '12px', fontStyle: 'bold', color: '#00ffcc' }).setOrigin(0.5, 0)
    if (cosmetic.bonusLabel !== 'Balanced') {
      this.add.text(p + leftW / 2, gearY + 86, cosmetic.bonusLabel,
        { fontSize: '9px', color: '#445566' }).setOrigin(0.5, 0)
    }

    const statsY = gearY + 100
    const statSt = { fontSize: '12px', fontStyle: 'bold', color: '#556677' }
    this.add.text(p + 6, statsY,      `Runs:   ${save.stats.runsCompleted}`, statSt)
    this.add.text(p + 6, statsY + 20, `Kills:  ${save.stats.totalKills}`, statSt)
    this.add.text(p + 6, statsY + 40, `Gold:   ${save.stats.totalGold}`, statSt)
    this.add.text(p + 6, statsY + 60,
      `Bosses: ${Object.values(save.progress).filter(prog => prog.bossDefeated).length}/3`, statSt)
    // Today's modifier preview
    const todayDate = new Date()
    const dailySeed = todayDate.getFullYear() * 10000 + (todayDate.getMonth() + 1) * 100 + todayDate.getDate()
    const dailyMod = RUN_MODIFIERS[dailySeed % RUN_MODIFIERS.length]
    if (dailyMod) {
      this.add.text(p + 6, statsY + 80, `Daily: ${dailyMod.icon} ${dailyMod.title}`, { fontSize: '9px', color: '#2a4a2a' })
    }

    const setBtn = this.add.text(p + 6, gearY + gearH - 20, '[ SETTINGS ]',
      { fontSize: '10px', color: '#334455' }).setInteractive({ useHandCursor: true })
    setBtn.on('pointerover', () => setBtn.setColor('#aaaaaa'))
    setBtn.on('pointerout',  () => setBtn.setColor('#334455'))
    setBtn.on('pointerdown', () => this.scene.start('Settings'))

    // ─ Center: equipped gear ─
    const centX  = p + leftW + 6
    const eqRowH = Math.floor((gearH - 24) / SLOT_ORDER.length)
    this.add.rectangle(centX, gearY, centW, gearH, 0x0a1520).setOrigin(0)
    this.add.text(centX + centW / 2, gearY + 6, 'EQUIPPED  [✕] destroy',
      { fontSize: '11px', fontStyle: 'bold', color: '#445566' }).setOrigin(0.5, 0)

    SLOT_ORDER.forEach((slot, i) => {
      const ery   = gearY + 22 + i * eqRowH
      this.add.text(centX + 4, ery, SLOT_LABELS[slot as EquipSlot],
        { fontSize: '9px', fontStyle: 'bold', color: '#3a5060' })
      const item  = save.equippedGear[slot as EquipSlot]
      if (item) {
        const nm    = item.name.length > 15 ? item.name.substring(0, 14) + '…' : item.name
        const color = RARITY_COLOR[item.rarity] ?? '#aaaaaa'
        this.add.text(centX + 4, ery + 12, nm, { fontSize: '13px', fontStyle: 'bold', color })
        const del = this.add.text(centX + centW - 4, ery + 12, '[✕]',
          { fontSize: '10px', color: '#553333' })
          .setOrigin(1, 0).setInteractive({ useHandCursor: true })
        del.on('pointerover', () => del.setColor('#ff4444'))
        del.on('pointerout',  () => del.setColor('#553333'))
        del.on('pointerdown', () => {
          delete save.equippedGear[slot as EquipSlot]
          SaveManager.save(save)
          this.scene.restart()
        })
      } else {
        this.add.text(centX + 4, ery + 12, '--', { fontSize: '13px', color: '#1e2e3e' })
      }
    })

    // ─ Right: bag ─
    const rx         = centX + centW + 6
    const bagRowH    = 30
    const bagMaxRows = Math.floor((gearH - 24) / bagRowH)
    this.add.rectangle(rx, gearY, rightW, gearH, 0x0a1520).setOrigin(0)
    this.add.text(rx + rightW / 2, gearY + 6, `BAG ${save.bag.length}  [✕] destroy`,
      { fontSize: '11px', fontStyle: 'bold', color: '#445566' }).setOrigin(0.5, 0)

    if (save.bag.length === 0) {
      this.add.text(rx + 6, gearY + 28, '(empty)', { fontSize: '12px', color: '#2a3a4a' })
    } else {
      save.bag.slice(0, bagMaxRows).forEach((item, i) => {
        const iy    = gearY + 22 + i * bagRowH
        const color = RARITY_COLOR[item.rarity] ?? '#aaaaaa'
        const nm    = item.name.length > 13 ? item.name.substring(0, 12) + '…' : item.name
        this.add.text(rx + 6, iy,      nm,          { fontSize: '13px', fontStyle: 'bold', color })
        this.add.text(rx + 6, iy + 16, item.rarity, { fontSize: '10px', color: '#3a5060' })
        const del = this.add.text(rx + rightW - 4, iy + 8, '[✕]',
          { fontSize: '10px', color: '#553333' })
          .setOrigin(1, 0).setInteractive({ useHandCursor: true })
        del.on('pointerover', () => del.setColor('#ff4444'))
        del.on('pointerout',  () => del.setColor('#553333'))
        del.on('pointerdown', () => {
          save.bag.splice(i, 1)
          SaveManager.save(save)
          this.scene.restart()
        })
      })
      if (save.bag.length > bagMaxRows) {
        const oy = gearY + 22 + bagMaxRows * bagRowH
        this.add.text(rx + 6, oy, `+${save.bag.length - bagMaxRows} more`,
          { fontSize: '10px', color: '#334455' })
      }
    }

    // ── Cosmetics — colored circle per skin, no sprite copies ────────────────
    y = gearY + gearH + 8
    this.add.text(p, y, 'COSMETICS',
      { fontSize: '12px', fontStyle: 'bold', color: '#445566' })

    const cosBoxW   = 50
    const cosBoxH   = 54
    const cosTotalW = COSMETICS.length * cosBoxW + (COSMETICS.length - 1) * 4
    const cosStartX = Math.floor((W - cosTotalW) / 2)

    COSMETICS.forEach((cos, i) => {
      const ccx         = cosStartX + i * (cosBoxW + 4)
      const ccy         = y + 14
      const unlocked    = save.unlockedCosmetics.includes(cos.id)
      const isActiveCos = save.activeCosmetic === cos.id
      const canBuy      = !unlocked && !cos.fromBoss && save.gold >= cos.price

      const box = this.add.rectangle(ccx, ccy, cosBoxW, cosBoxH, isActiveCos ? 0x003322 : 0x080f18)
        .setOrigin(0).setStrokeStyle(1, isActiveCos ? 0x00ffcc : 0x1a2a3a)

      // Solid color circle — one clear swatch showing this skin's color
      const dot = this.add.circle(ccx + cosBoxW / 2, ccy + 15, 11, unlocked ? cos.tint : 0x111a28)
      if (isActiveCos) dot.setStrokeStyle(2, 0x00ffcc)
      else if (canBuy)  dot.setStrokeStyle(1, 0x665533)

      this.add.text(ccx + cosBoxW / 2, ccy + 28, cos.name, {
        fontSize: '9px', fontStyle: 'bold', color: unlocked ? '#99aaaa' : '#2a3a4a',
      }).setOrigin(0.5, 0)

      if (!unlocked && !cos.fromBoss) {
        this.add.text(ccx + cosBoxW / 2, ccy + 40, `${cos.price}g`, {
          fontSize: '8px', color: canBuy ? '#ffd700' : '#554400',
        }).setOrigin(0.5, 0)
      } else if (!unlocked && cos.fromBoss) {
        this.add.text(ccx + cosBoxW / 2, ccy + 40, 'Boss',
          { fontSize: '8px', color: '#664400' }).setOrigin(0.5, 0)
      } else if (cos.bonusLabel !== 'Balanced') {
        this.add.text(ccx + cosBoxW / 2, ccy + 40, cos.bonusLabel,
          { fontSize: '7px', color: '#445566' }).setOrigin(0.5, 0)
      }

      if (unlocked || canBuy) {
        // Box covers the whole cell — non-interactive objects above pass clicks through
        box.setInteractive({ useHandCursor: true })
        box.on('pointerover', () => {
          if (!isActiveCos) box.setStrokeStyle(1, unlocked ? 0x336655 : 0x665533)
        })
        box.on('pointerout', () => {
          if (!isActiveCos) box.setStrokeStyle(1, 0x1a2a3a)
        })
        box.on('pointerdown', () => {
          if (!unlocked) {
            if (save.gold < cos.price) return
            save.gold -= cos.price
            save.unlockedCosmetics.push(cos.id)
          }
          save.activeCosmetic = cos.id
          SaveManager.save(save)
          this.scene.restart()
        })
      }
    })

    // ── Difficulty ───────────────────────────────────────────────────────────
    y += cosBoxH + 12
    this.add.rectangle(p, y, W - p * 2, 74, 0x050f0a).setOrigin(0).setStrokeStyle(1, 0x112211)
    this.add.text(W / 2, y + 7, 'DIFFICULTY',
      { fontSize: '12px', fontStyle: 'bold', color: '#445566' }).setOrigin(0.5, 0)

    const diffBtnW = Math.floor((W - p * 2 - 20) / 3)
    const diffBtnH = 30
    const diffBtnY = y + 20

    ;(['easy', 'normal', 'hard'] as Difficulty[]).forEach((diff, i) => {
      const dbx   = p + i * (diffBtnW + 10)
      const cfg   = DIFF_CFG[diff]
      const isAct = activeDiff === diff

      const btn = this.add.rectangle(dbx, diffBtnY, diffBtnW, diffBtnH, isAct ? cfg.bg : 0x0a1520)
        .setOrigin(0).setStrokeStyle(1, isAct ? parseInt(cfg.color.replace('#', ''), 16) : 0x1a2a3a)
        .setInteractive({ useHandCursor: true })
      this.add.text(dbx + diffBtnW / 2, diffBtnY + diffBtnH / 2, cfg.label, {
        fontSize: '14px', fontStyle: 'bold', color: isAct ? cfg.color : '#445566',
      }).setOrigin(0.5)

      btn.on('pointerdown', () => {
        save.difficulty = diff
        SaveManager.save(save)
        this.scene.restart()
      })
      if (!isAct) {
        btn.on('pointerover', () => btn.setStrokeStyle(1, 0x334455))
        btn.on('pointerout',  () => btn.setStrokeStyle(1, 0x1a2a3a))
      }
    })

    this.add.text(W / 2, diffBtnY + diffBtnH + 6, DIFF_CFG[activeDiff].desc,
      { fontSize: '9px', color: '#445566' }).setOrigin(0.5, 0)

    // ── Dungeon Selection ────────────────────────────────────────────────────
    y += 74 + 8
    this.add.text(W / 2, y, 'SELECT DUNGEON',
      { fontSize: '12px', fontStyle: 'bold', color: '#445566' }).setOrigin(0.5, 0)

    const themeBtnW = Math.floor((W - p * 2 - 20) / 3)
    const themeBtnH = 72
    const themeBtnY = y + 14

    THEMES.forEach((theme, i) => {
      const tbx     = p + i * (themeBtnW + 10)
      const prog    = save.progress[theme]
      const isActTh = activeThemeRef.value === theme

      const bg = this.add.rectangle(tbx, themeBtnY, themeBtnW, themeBtnH, isActTh ? 0x002233 : 0x0a1520)
        .setOrigin(0).setStrokeStyle(1, isActTh ? 0x00ffcc : 0x1a2a3a)

      this.add.text(tbx + themeBtnW / 2, themeBtnY + 12,
        theme.charAt(0).toUpperCase() + theme.slice(1), {
          fontSize: '16px', fontStyle: 'bold', color: isActTh ? '#00ffcc' : '#556677',
        }).setOrigin(0.5, 0)
      this.add.text(tbx + themeBtnW / 2, themeBtnY + 30, `Floor ${prog.highestFloor}/5`,
        { fontSize: '11px', color: '#445566' }).setOrigin(0.5, 0)
      this.add.text(tbx + themeBtnW / 2, themeBtnY + 44,
        prog.bossDefeated ? '★ Cleared' : `F${prog.highestFloor} reached`, {
          fontSize: '10px', color: prog.bossDefeated ? '#ffd700' : '#2a3a4a',
        }).setOrigin(0.5, 0)
      const diffColors: Record<Difficulty, string> = { easy: '#44cc44', normal: '#445566', hard: '#cc3333' }
      this.add.text(tbx + themeBtnW / 2, themeBtnY + themeBtnH - 12, DIFF_CFG[activeDiff].label,
        { fontSize: '9px', fontStyle: 'bold', color: diffColors[activeDiff] }).setOrigin(0.5, 0)

      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => {
        activeThemeRef.value = theme
        this.registry.set('mapTheme', theme)
        this.scene.restart()
      })
      if (!isActTh) {
        bg.on('pointerover', () => bg.setStrokeStyle(1, 0x334455))
        bg.on('pointerout',  () => bg.setStrokeStyle(1, 0x1a2a3a))
      }
    })

    // ── Challenge Modifiers ──────────────────────────────────────────────────
    y = themeBtnY + themeBtnH + 10
    const challenges: { id: string; label: string; desc: string; bonus: number }[] = [
      { id: 'bloodthirst',  label: 'Bloodthirst',  desc: 'Enemies +50% HP',      bonus: 150 },
      { id: 'ironman',      label: 'Ironman',       desc: 'No healing items',      bonus: 200 },
      { id: 'slippery',     label: 'Slippery',      desc: 'Roll CD +400ms',        bonus: 100 },
      { id: 'overcrowded',  label: 'Overcrowded',   desc: '+50% enemy count',      bonus: 175 },
      { id: 'glass_cannon', label: 'Glass Cannon',  desc: 'Player −30% HP',        bonus: 250 },
    ]
    const activeChallRef: { ids: string[] } = { ids: [] }

    const chalPanelH = 10 + challenges.length * 20 + 6
    this.add.rectangle(p, y, W - p * 2, chalPanelH, 0x08120a).setOrigin(0).setStrokeStyle(1, 0x1a2a1a)
    this.add.text(W / 2, y + 5, 'OPTIONAL CHALLENGES', { fontSize: '9px', fontStyle: 'bold', color: '#334433' }).setOrigin(0.5, 0)

    const checkboxes: Phaser.GameObjects.Text[] = []
    challenges.forEach((ch, i) => {
      const cy = y + 16 + i * 20
      const cb = this.add.text(p + 6, cy, '[ ]', { fontSize: '11px', color: '#335533' })
        .setInteractive({ useHandCursor: true })
      checkboxes.push(cb)
      this.add.text(p + 30, cy, ch.label, { fontSize: '11px', fontStyle: 'bold', color: '#446644' })
      this.add.text(p + 120, cy, ch.desc, { fontSize: '9px', color: '#334433' })
      this.add.text(W - p - 4, cy, `+${ch.bonus}g`, { fontSize: '9px', color: '#558844' }).setOrigin(1, 0)
      cb.on('pointerover', () => cb.setColor('#aaffaa'))
      cb.on('pointerout',  () => cb.setColor(activeChallRef.ids.includes(ch.id) ? '#00ff88' : '#335533'))
      cb.on('pointerdown', () => {
        const idx = activeChallRef.ids.indexOf(ch.id)
        if (idx >= 0) {
          activeChallRef.ids.splice(idx, 1)
          cb.setColor('#335533')
          cb.setText('[ ]')
        } else {
          activeChallRef.ids.push(ch.id)
          cb.setColor('#00ff88')
          cb.setText('[✓]')
        }
      })
    })

    // ── Start & Footer ───────────────────────────────────────────────────────
    y += chalPanelH + 8

    const startBtn = this.add.text(W / 2, y, '[ START RUN ]', {
      fontSize: '28px', fontStyle: 'bold', color: '#00ffcc',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
    startBtn.on('pointerover', () => startBtn.setColor('#ffffff'))
    startBtn.on('pointerout',  () => startBtn.setColor('#00ffcc'))
    startBtn.on('pointerdown', () => {
      const bonus = activeChallRef.ids.reduce((sum, id) => {
        const ch = challenges.find(c => c.id === id)
        return sum + (ch?.bonus ?? 0)
      }, 0)
      this.registry.set('runChallenges', [...activeChallRef.ids])
      this.registry.set('runChallengeGoldBonus', bonus)
      this.registry.set('currentFloor', 1)
      this.registry.remove('runState')
      this.scene.start('DungeonScene')
    })

    this.add.text(W / 2, y + 46, 'Gear from successful runs is kept. Death loses bag items.',
      { fontSize: '9px', color: '#2a3a2a' }).setOrigin(0.5, 0)
    this.add.text(W - p, H - 6, 'v0.1', { fontSize: '7px', color: '#1a2a1a' }).setOrigin(1, 1)
  }
}
