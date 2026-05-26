import Phaser from 'phaser'
import { SKILL_TREE, CLASS_SKILL_TREE, type TrackId } from '../systems/SkillTree'
import { CLASSES } from '../systems/ClassDefs'
import { SaveManager } from '../systems/SaveManager'

const TRACK_COLOR: Record<TrackId, { stroke: number; label: string; header: string }> = {
  warrior:   { stroke: 0xff6644, label: '#ff9977', header: 'WARRIOR'   },
  sentinel:  { stroke: 0x4488ff, label: '#88bbff', header: 'SENTINEL'  },
  scavenger: { stroke: 0xffcc44, label: '#ffee99', header: 'SCAVENGER' },
  rogue:     { stroke: 0xaa44ff, label: '#cc88ff', header: 'ROGUE'     },
  ranger:    { stroke: 0x44cc44, label: '#88ff88', header: 'RANGER'    },
  mage:      { stroke: 0x4488ff, label: '#88bbff', header: 'MAGE'      },
}

export class SkillScene extends Phaser.Scene {
  constructor() { super('SkillScene') }

  create() {
    const save = SaveManager.load()
    const W = this.scale.width
    const H = this.scale.height
    void H

    this.add.rectangle(0, 0, W, this.scale.height, 0x000810).setOrigin(0)

    this.add.text(W / 2, 14, 'SKILL TREE',
      { fontSize: '22px', fontStyle: 'bold', color: '#00ffcc' }).setOrigin(0.5, 0)
    this.add.text(W / 2, 42, `Gold: ${save.gold}`,
      { fontSize: '13px', fontStyle: 'bold', color: '#ffd700' }).setOrigin(0.5, 0)

    const isClassMode = save.selectedClass !== null && save.selectedClass !== undefined
    const nodeH = 52
    const rowGap = 8

    if (isClassMode) {
      this.renderClassSkillTree(save, W, nodeH, rowGap)
    } else {
      this.renderKnightSkillTree(save, W, nodeH, rowGap)
    }
  }

  private renderKnightSkillTree(save: ReturnType<typeof SaveManager.load>, W: number, nodeH: number, rowGap: number) {
    const TRACKS: TrackId[] = ['warrior', 'sentinel', 'scavenger']
    const colW = 140
    const colGap = 10
    const totalW = TRACKS.length * colW + (TRACKS.length - 1) * colGap
    const startX = Math.floor((W - totalW) / 2)

    TRACKS.forEach((track, ci) => {
      const cx = startX + ci * (colW + colGap) + colW / 2
      this.add.text(cx, 64, TRACK_COLOR[track].header,
        { fontSize: '11px', fontStyle: 'bold', color: TRACK_COLOR[track].label }).setOrigin(0.5, 0)
    })

    const nodeStartY = 82
    SKILL_TREE.forEach(node => {
      const ci = TRACKS.indexOf(node.track)
      const nx = startX + ci * (colW + colGap)
      const ny = nodeStartY + (node.tier - 1) * (nodeH + rowGap)
      const cx = nx + colW / 2

      const owned = save.skills.includes(node.id)
      const prereqId = node.tier > 1
        ? SKILL_TREE.find(n => n.track === node.track && n.tier === node.tier - 1)?.id
        : null
      const prereqMet = node.tier === 1 || (prereqId ? save.skills.includes(prereqId) : true)
      const affordable = save.gold >= node.cost
      const canBuy = !owned && prereqMet && affordable

      const col = TRACK_COLOR[node.track]
      let bgColor = 0x0a1520
      let strokeColor = 0x1a2a3a
      let strokeThick = 1
      if (owned)           { bgColor = 0x003322; strokeColor = col.stroke; strokeThick = 2 }
      else if (canBuy)     { bgColor = 0x101825; strokeColor = 0x445566; strokeThick = 1 }
      else if (!prereqMet) { bgColor = 0x050a10; strokeColor = 0x0d1520; strokeThick = 1 }

      const box = this.add.rectangle(nx, ny, colW, nodeH, bgColor)
        .setOrigin(0).setStrokeStyle(strokeThick, strokeColor)

      const tierColor = owned ? col.label : (prereqMet ? '#445566' : '#1a2a3a')
      this.add.text(nx + 5, ny + 4, `T${node.tier}`, { fontSize: '9px', color: tierColor })
      if (owned) {
        this.add.text(nx + colW - 5, ny + 4, '✓',
          { fontSize: '10px', fontStyle: 'bold', color: '#00ffcc' }).setOrigin(1, 0)
      }

      const nameColor = owned ? '#00ffcc' : (prereqMet ? col.label : '#223344')
      this.add.text(cx, ny + 7, node.name,
        { fontSize: '12px', fontStyle: 'bold', color: nameColor }).setOrigin(0.5, 0)

      const descColor = owned ? '#556677' : (prereqMet ? '#334455' : '#1a2535')
      this.add.text(cx, ny + 23, node.desc,
        { fontSize: '8px', color: descColor, wordWrap: { width: colW - 8 } }).setOrigin(0.5, 0)

      if (!owned) {
        const costColor = canBuy ? '#ffd700' : (prereqMet ? '#554400' : '#1a2030')
        const label = !prereqMet ? 'Locked' : `${node.cost}g`
        this.add.text(cx, ny + nodeH - 12, label,
          { fontSize: '9px', color: costColor }).setOrigin(0.5, 0)
      }

      if (canBuy) {
        box.setInteractive({ useHandCursor: true })
        box.on('pointerover', () => box.setStrokeStyle(2, col.stroke))
        box.on('pointerout',  () => box.setStrokeStyle(1, 0x445566))
        box.on('pointerdown', () => {
          save.gold -= node.cost
          if (!save.skills.includes(node.id)) save.skills.push(node.id)
          SaveManager.save(save)
          this.scene.restart()
        })
      }
    })

    const backY = nodeStartY + 5 * (nodeH + rowGap) + 20
    const back = this.add.text(W / 2, backY, '[ BACK ]',
      { fontSize: '18px', fontStyle: 'bold', color: '#445566' })
      .setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
    back.on('pointerover', () => back.setColor('#aaaaaa'))
    back.on('pointerout',  () => back.setColor('#445566'))
    back.on('pointerdown', () => this.scene.start('LobbyScene'))

    this.add.text(W / 2, backY + 30, `${save.skills.length} / ${SKILL_TREE.length} skills unlocked`,
      { fontSize: '9px', color: '#2a3a4a' }).setOrigin(0.5, 0)
  }

  private renderClassSkillTree(save: ReturnType<typeof SaveManager.load>, W: number, nodeH: number, rowGap: number) {
    const classId = save.selectedClass!
    const classDef = CLASSES.find(c => c.id === classId)
    if (!classDef) { this.renderKnightSkillTree(save, W, nodeH, rowGap); return }

    const col = TRACK_COLOR[classId as TrackId]
    const colW = 300
    const startX = Math.floor((W - colW) / 2)
    const ownedSkills = save.classSkills ?? []

    // Abilities panel
    const panelX = startX
    const panelY = 58
    const panelH = 86
    this.add.rectangle(panelX, panelY, colW, panelH, 0x080f18)
      .setOrigin(0).setStrokeStyle(1, col.stroke)
    this.add.text(panelX + colW / 2, panelY + 5, `${classDef.name.toUpperCase()} ABILITIES`,
      { fontSize: '11px', fontStyle: 'bold', color: col.label }).setOrigin(0.5, 0)
    const cdE = (classDef.abilityE.cooldown / 1000).toFixed(0)
    const cdR = (classDef.abilityR.cooldown / 1000).toFixed(0)
    this.add.text(panelX + 8, panelY + 20, `[E] ${classDef.abilityE.name}   CD: ${cdE}s`,
      { fontSize: '11px', fontStyle: 'bold', color: col.label })
    this.add.text(panelX + 8, panelY + 33, classDef.abilityE.desc,
      { fontSize: '8px', color: '#445566', wordWrap: { width: colW - 16 } })
    this.add.text(panelX + 8, panelY + 50, `[R] ${classDef.abilityR.name}   CD: ${cdR}s`,
      { fontSize: '11px', fontStyle: 'bold', color: col.label })
    this.add.text(panelX + 8, panelY + 63, classDef.abilityR.desc,
      { fontSize: '8px', color: '#445566', wordWrap: { width: colW - 16 } })

    // Class skill nodes
    const classNodes = CLASS_SKILL_TREE.filter(n => n.track === classId)
    const nodeStartY = panelY + panelH + 10
    classNodes.forEach(node => {
      const nx = startX
      const ny = nodeStartY + (node.tier - 1) * (nodeH + rowGap)
      const cx = nx + colW / 2

      const owned = ownedSkills.includes(node.id)
      const prereqId = node.tier > 1
        ? classNodes.find(n => n.track === node.track && n.tier === node.tier - 1)?.id
        : null
      const prereqMet = node.tier === 1 || (prereqId ? ownedSkills.includes(prereqId) : true)
      const affordable = save.gold >= node.cost
      const canBuy = !owned && prereqMet && affordable

      let bgColor = 0x0a1520
      let strokeColor = 0x1a2a3a
      let strokeThick = 1
      if (owned)           { bgColor = 0x0d1f0d; strokeColor = col.stroke; strokeThick = 2 }
      else if (canBuy)     { bgColor = 0x101825; strokeColor = 0x445566; strokeThick = 1 }
      else if (!prereqMet) { bgColor = 0x050a10; strokeColor = 0x0d1520; strokeThick = 1 }

      const box = this.add.rectangle(nx, ny, colW, nodeH, bgColor)
        .setOrigin(0).setStrokeStyle(strokeThick, strokeColor)

      const tierColor = owned ? col.label : (prereqMet ? '#445566' : '#1a2a3a')
      this.add.text(nx + 5, ny + 4, `T${node.tier}`, { fontSize: '9px', color: tierColor })
      if (owned) {
        this.add.text(nx + colW - 5, ny + 4, '✓',
          { fontSize: '10px', fontStyle: 'bold', color: '#00ffcc' }).setOrigin(1, 0)
      }

      const nameColor = owned ? '#00ffcc' : (prereqMet ? col.label : '#223344')
      this.add.text(cx, ny + 7, node.name,
        { fontSize: '12px', fontStyle: 'bold', color: nameColor }).setOrigin(0.5, 0)

      const descColor = owned ? '#556677' : (prereqMet ? '#334455' : '#1a2535')
      this.add.text(cx, ny + 23, node.desc,
        { fontSize: '9px', color: descColor, wordWrap: { width: colW - 16 } }).setOrigin(0.5, 0)

      if (!owned) {
        const costColor = canBuy ? '#ffd700' : (prereqMet ? '#554400' : '#1a2030')
        const label = !prereqMet ? 'Locked' : `${node.cost}g`
        this.add.text(cx, ny + nodeH - 12, label,
          { fontSize: '9px', color: costColor }).setOrigin(0.5, 0)
      }

      if (canBuy) {
        box.setInteractive({ useHandCursor: true })
        box.on('pointerover', () => box.setStrokeStyle(2, col.stroke))
        box.on('pointerout',  () => box.setStrokeStyle(1, 0x445566))
        box.on('pointerdown', () => {
          save.gold -= node.cost
          if (!save.classSkills) save.classSkills = []
          if (!save.classSkills.includes(node.id)) save.classSkills.push(node.id)
          SaveManager.save(save)
          this.scene.restart()
        })
      }
    })

    const backY = nodeStartY + 6 * (nodeH + rowGap) + 8
    const back = this.add.text(W / 2, backY, '[ BACK ]',
      { fontSize: '18px', fontStyle: 'bold', color: '#445566' })
      .setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
    back.on('pointerover', () => back.setColor('#aaaaaa'))
    back.on('pointerout',  () => back.setColor('#445566'))
    back.on('pointerdown', () => this.scene.start('LobbyScene'))

    this.add.text(W / 2, backY + 30, `${ownedSkills.length} / ${classNodes.length} ${classDef.name} skills unlocked`,
      { fontSize: '9px', color: '#2a3a4a' }).setOrigin(0.5, 0)
  }
}
