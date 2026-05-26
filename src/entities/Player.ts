import Phaser from 'phaser'
import { Inventory } from '../systems/Inventory'
import { Bag } from '../systems/Bag'
import { WEAPONS, type WeaponDef } from '../systems/WeaponDefs'
import type { ItemDef } from '../systems/ItemDefs'
import { getKey } from '../systems/KeyBindings'
import type { CosmeticBonus } from '../systems/Cosmetics'
import { type StatusEffect, applyStatus as addStatus, tickStatuses, pruneExpired } from '../systems/StatusEffect'
import { computeSkillEffects, type ClassSkillEffects } from '../systems/SkillTree'

export class Player extends Phaser.Physics.Arcade.Sprite {
  maxHp = 100
  hp = 100
  facingAngle = 0

  readonly inventory = new Inventory()
  readonly bag = new Bag()
  activeSlot: 0 | 1 = 0

  private _cosmeticTint = 0xffffff
  private _cosmeticBonus: CosmeticBonus = {}
  private baseSpeed = 165
  private atkCooldown = 0
  private isRolling = false
  private rollCooldown = 0
  private readonly ROLL_CD = 1200
  private _rollCdExtra = 0
  private readonly ROLL_DURATION = 200
  private _tempSpeedBonus = 0
  private _tempSpeedTimer = 0
  private _shieldHp = 0
  private _daggerComboCount = 0
  private _daggerComboTimer = 0

  private _statusEffects: StatusEffect[] = []
  private _playerSlowMult = 1
  private _tempDamageMult = 1
  private _tempDamageTimer = 0
  private _smokeActive = false
  private _smokeTimer = 0

  private _skillDamageMult = 1
  private _skillCritBonus = 0
  private _skillMaxHp = 0
  private _skillArmorBonus = 0
  private _skillRollCdReduction = 0
  private _skillStatusDurMult = 1
  private _skillLootMult = 1
  private _skillShopDiscount = 0
  private _skillBagBonus = 0
  private _skillGoldPerKill = 0
  private _skillLegendaryBonus = 0
  private _skillBerserkerOnKill = false
  private _skillExecuteBonus = false
  private _skillCritAppliesCripple = false
  private _lastStandAvailable = false
  private _skillBloodlust = false
  private _skillScavengerInstinct = false

  // Class system
  private _activeClass: 'rogue' | 'ranger' | 'mage' | null = null
  private _abilityEKey!: Phaser.Input.Keyboard.Key
  private _abilityRKey!: Phaser.Input.Keyboard.Key
  private _abilityCdE = 0
  private _abilityCdR = 0
  private _abilityCdEMax = 0
  private _abilityCdRMax = 0
  // Class skill effect flags
  private _rogueBladeFlurry = false
  private _rogueBackstab = false
  private _roguePoisonedBlades = false
  private _rogueShadowVanish = false
  private _rogueDeathMark = false
  private _rogueKillingSpree = false
  private _rangerHawkeye = false
  private _rangerRapidFire = false
  private _rangerExplosiveArrow = false
  private _rangerTrapExpert = false
  private _rangerEagleEye = false
  private _rangerPredator = false
  private _rangerPredatorCharges = 0
  private _mageArcanePower = false
  private _mageFrostNova = false
  private _mageChainLightning = false
  private _mageManaShield = false
  private _mageManaShieldCd = 0
  private _mageOverload = false
  private _mageOverloadCounter = 0
  private _mageArcaneMastery = false
  private _isAimingShot = false
  private _aimCharge = 0

  private hpGfx!: Phaser.GameObjects.Graphics
  private hpTimer = 0
  private readonly HP_SHOW_MS = 2200

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<string, Phaser.Input.Keyboard.Key>

  private touchMoveId = -1
  private touchOrigin = new Phaser.Math.Vector2()
  private touchCurrent = new Phaser.Math.Vector2()

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDepth(5)
    ;(this.body as Phaser.Physics.Arcade.Body).setSize(20, 24)
    this.hpGfx = scene.add.graphics().setDepth(7)
  }

  get currentWeapon(): WeaponDef {
    const stats = this.inventory.getStats()
    return (this.activeSlot === 0 ? stats.weapon1 : stats.weapon2) ?? WEAPONS.sword
  }

  get attackCooldownMax(): number {
    let base = this.currentWeapon.cooldown * this.inventory.getStats().atkSpeedMult * (this._cosmeticBonus.atkSpeedMult ?? 1)
    if (this._rogueBladeFlurry && (this.currentWeapon.type === 'dagger' || this.currentWeapon.type === 'dual_dagger')) base *= 0.85
    if (this._rangerRapidFire && this.currentWeapon.type === 'bow') base *= 0.80
    return base
  }

  get moveSpeed(): number {
    return (this.baseSpeed + this.inventory.getStats().speedBonus + this._tempSpeedBonus + (this._cosmeticBonus.speed ?? 0)) * this._playerSlowMult
  }

  get shieldHp(): number { return this._shieldHp }

  get effectiveMaxHp(): number {
    return this.maxHp + this.inventory.getStats().maxHpBonus + (this._cosmeticBonus.maxHp ?? 0) + this._skillMaxHp
  }

  get cosmeticBonus(): CosmeticBonus { return this._cosmeticBonus }

  get rolling(): boolean { return this.isRolling }
  get atkCooldownRemaining(): number { return this.atkCooldown }
  get rollCooldownRemaining(): number { return this.rollCooldown }
  get rollCooldownMax(): number {
    const windBonus = this.inventory.getActiveSets().includes('wind') ? 200 : 0
    return Math.max(400, this.ROLL_CD - this._skillRollCdReduction - windBonus + this._rollCdExtra)
  }
  addRollCdPenalty(ms: number) { this._rollCdExtra += ms }
  get skillDamageMult(): number        { return this._skillDamageMult }
  get skillCritBonus(): number          { return this._skillCritBonus }
  get skillArmorBonus(): number         { return this._skillArmorBonus }
  get skillLootMult(): number           { return this._skillLootMult }
  get skillShopDiscount(): number       { return this._skillShopDiscount }
  get skillBagBonus(): number           { return this._skillBagBonus }
  get skillGoldPerKill(): number        { return this._skillGoldPerKill }
  get skillLegendaryBonus(): number     { return this._skillLegendaryBonus }
  get skillBerserkerOnKill(): boolean   { return this._skillBerserkerOnKill }
  get skillExecuteBonus(): boolean      { return this._skillExecuteBonus }
  get skillCritAppliesCripple(): boolean{ return this._skillCritAppliesCripple }
  get skillStatusDurMult(): number      { return this._skillStatusDurMult }
  get tempDamageMult(): number          { return this._tempDamageMult }
  get smokeActive(): boolean            { return this._smokeActive }
  get daggerComboBonus(): number { return this._daggerComboCount * 5 }
  get daggerComboCount(): number { return this._daggerComboCount }
  get skillBloodlust(): boolean         { return this._skillBloodlust }
  get skillScavengerInstinct(): boolean { return this._skillScavengerInstinct }

  // Class system getters
  get abilityCdE(): number      { return this._abilityCdE }
  get abilityCdEMax(): number   { return this._abilityCdEMax }
  get abilityCdR(): number      { return this._abilityCdR }
  get abilityCdRMax(): number   { return this._abilityCdRMax }
  get activeClass()             { return this._activeClass }
  get isAimingShot()            { return this._isAimingShot }
  get aimCharge()               { return this._aimCharge }
  // Rogue
  get rogueDeathMark()          { return this._rogueDeathMark }
  get roguePoisonedBlades()     { return this._roguePoisonedBlades }
  get rogueBackstab()           { return this._rogueBackstab }
  get rogueKillingSpree()       { return this._rogueKillingSpree }
  get rogueShadowVanish()       { return this._rogueShadowVanish }
  // Ranger
  get rangerExplosiveArrow()    { return this._rangerExplosiveArrow }
  get rangerHawkeye()           { return this._rangerHawkeye }
  get rangerEagleEye()          { return this._rangerEagleEye }
  get rangerPredator()          { return this._rangerPredator }
  get rangerPredatorCharges()   { return this._rangerPredatorCharges }
  get rangerTrapExpert()        { return this._rangerTrapExpert }
  // Mage
  get mageArcanePower()         { return this._mageArcanePower }
  get mageFrostNova()           { return this._mageFrostNova }
  get mageChainLightning()      { return this._mageChainLightning }
  get mageOverload()            { return this._mageOverload }
  get mageOverloadCounter()     { return this._mageOverloadCounter }
  get mageArcaneMastery()       { return this._mageArcaneMastery }
  get mageManaShield()          { return this._mageManaShield }
  get mageManaShieldCd()        { return this._mageManaShieldCd }

  setCosmeticTint(tint: number) {
    this._cosmeticTint = tint
    if (tint !== 0xffffff) this.setTint(tint)
    else this.clearTint()
  }

  setCosmeticBonus(bonus: CosmeticBonus) {
    this._cosmeticBonus = bonus
  }

  private restoreCosmeticTint() {
    if (this._cosmeticTint !== 0xffffff) this.setTint(this._cosmeticTint)
    else this.clearTint()
  }

  setupInput(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!
    this.cursors = kb.createCursorKeys()
    this.keys = {
      up:     kb.addKey(getKey('up',     'W')),
      down:   kb.addKey(getKey('down',   'S')),
      left:   kb.addKey(getKey('left',   'A')),
      right:  kb.addKey(getKey('right',  'D')),
      attack: kb.addKey(getKey('attack', 'SPACE')),
      roll:   kb.addKey(getKey('roll',   'Q')),
      swap:   kb.addKey(getKey('swap',   'F')),
    }
    this._abilityEKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this._abilityRKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.R)
  }

  startTouchMove(id: number, x: number, y: number) {
    if (this.touchMoveId !== -1) return
    this.touchMoveId = id
    this.touchOrigin.set(x, y)
    this.touchCurrent.set(x, y)
  }

  updateTouchMove(id: number, x: number, y: number) {
    if (id === this.touchMoveId) this.touchCurrent.set(x, y)
  }

  endTouchMove(id: number) {
    if (id === this.touchMoveId) {
      this.touchMoveId = -1
      if (!this.isRolling) this.setVelocity(0, 0)
    }
  }

  triggerAttack() {
    if (this.atkCooldown > 0 || this.isRolling) return
    this.atkCooldown = this.attackCooldownMax
    this.scene.events.emit('player-attack')
    if ((this.currentWeapon as WeaponDef).dualHit) {
      this.scene.time.delayedCall(80, () => {
        if (this.active) this.scene.events.emit('player-attack')
      })
    }
    this.setTint(0xffffaa)
    this.scene.time.delayedCall(120, () => { if (this.active) this.restoreCosmeticTint() })
  }

  triggerRoll() {
    if (this.rollCooldown > 0 || this.isRolling) return
    this.isRolling = true
    this.rollCooldown = this.rollCooldownMax
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(
      Math.cos(this.facingAngle) * this.moveSpeed * 2.5,
      Math.sin(this.facingAngle) * this.moveSpeed * 2.5,
    )
    this.scene.tweens.add({ targets: this, alpha: 0.3, duration: 55, yoyo: true, repeat: 3 })
    this.scene.time.delayedCall(this.ROLL_DURATION, () => { if (this.active) this.isRolling = false })
  }

  swapWeapon() { this.activeSlot = this.activeSlot === 0 ? 1 : 0 }

  setRolling(value: boolean) { this.isRolling = value }

  registerDaggerHit() {
    this._daggerComboCount = Math.min(3, this._daggerComboCount + 1)
    this._daggerComboTimer = 1000
  }

  applyStatus(effect: StatusEffect) {
    addStatus(this._statusEffects, effect)
    this.setTint(0xcc44ff)
    this.scene.time.delayedCall(150, () => { if (this.active && this.hp > 0) this.restoreCosmeticTint() })
  }

  applyTempSpeedBoost(amount: number, durationMs: number) {
    this._tempSpeedBonus = Math.max(this._tempSpeedBonus, amount)
    this._tempSpeedTimer = Math.max(this._tempSpeedTimer, durationMs)
  }

  applyTempDamageBoost(pct: number, durationMs: number) {
    this._tempDamageMult = Math.max(this._tempDamageMult, 1 + pct)
    this._tempDamageTimer = Math.max(this._tempDamageTimer, durationMs)
    this.setTint(0xffee44)
  }

  applySkills(skills: string[]) {
    const fx = computeSkillEffects(skills)
    this._skillDamageMult        = fx.damageMult
    this._skillCritBonus         = fx.critBonus
    this._skillMaxHp             = fx.maxHpBonus
    this._skillArmorBonus        = fx.armorBonus
    this._skillRollCdReduction   = fx.rollCdReduction
    this._skillStatusDurMult     = fx.statusDurMult
    this._lastStandAvailable     = fx.lastStand
    this._skillLootMult          = fx.lootMult
    this._skillShopDiscount      = fx.shopDiscount
    this._skillBagBonus          = fx.bagBonus
    this.bag.setCapacityBonus(fx.bagBonus)
    this._skillGoldPerKill       = fx.goldPerKill
    this._skillLegendaryBonus    = fx.legendaryBonus
    this._skillBerserkerOnKill   = fx.berserkerOnKill
    this._skillExecuteBonus      = fx.executeBonus
    this._skillCritAppliesCripple= fx.critAppliesCripple
    this._skillBloodlust         = fx.bloodlust
    this._skillScavengerInstinct = fx.scavengerInstinct
  }

  setClass(classId: 'rogue' | 'ranger' | 'mage' | null, cdE: number, cdR: number) {
    this._activeClass = classId
    this._abilityCdEMax = cdE
    this._abilityCdRMax = cdR
  }

  applyClassSkills(fx: ClassSkillEffects) {
    this._rogueBladeFlurry    = fx.rogueBladeFlurry
    this._rogueBackstab       = fx.rogueBackstab
    this._roguePoisonedBlades = fx.roguePoisonedBlades
    this._rogueShadowVanish   = fx.rogueShadowVanish
    this._rogueDeathMark      = fx.rogueDeathMark
    this._rogueKillingSpree   = fx.rogueKillingSpree
    this._rangerHawkeye       = fx.rangerHawkeye
    this._rangerRapidFire     = fx.rangerRapidFire
    this._rangerExplosiveArrow= fx.rangerExplosiveArrow
    this._rangerTrapExpert    = fx.rangerTrapExpert
    this._rangerEagleEye      = fx.rangerEagleEye
    this._rangerPredator      = fx.rangerPredator
    this._mageArcanePower     = fx.mageArcanePower
    this._mageFrostNova       = fx.mageFrostNova
    this._mageChainLightning  = fx.mageChainLightning
    this._mageManaShield      = fx.mageManaShield
    this._mageOverload        = fx.mageOverload
    this._mageArcaneMastery   = fx.mageArcaneMastery
  }

  resetAbilityCdE() { this._abilityCdE = 0 }

  grantPredatorCharges(n: number) { this._rangerPredatorCharges = n }

  consumePredatorCharge(): boolean {
    if (this._rangerPredatorCharges > 0) { this._rangerPredatorCharges--; return true }
    return false
  }

  incrementMageOverload(): boolean {
    if (!this._mageOverload) return false
    this._mageOverloadCounter++
    if (this._mageOverloadCounter >= 4) {
      this._mageOverloadCounter = 0
      return true
    }
    return false
  }

  applyMetaUpgrades(upgrades: Record<string, number>) {
    const vitality   = upgrades['vitality']    ?? 0
    const combatEdge = upgrades['combat_edge'] ?? 0
    const ironSkin   = upgrades['iron_skin']   ?? 0
    const nimble     = upgrades['nimble']      ?? 0
    const bagSpace   = upgrades['bag_space']   ?? 0
    if (vitality > 0)   this.maxHp += vitality * 5
    if (combatEdge > 0) this._skillDamageMult *= (1 + combatEdge * 0.02)
    if (ironSkin > 0)   this._skillArmorBonus += ironSkin
    if (nimble > 0)     this.baseSpeed += nimble * 3
    if (bagSpace > 0)   this.bag.setCapacityBonus(this.bag.capacityBonus + bagSpace)
  }

  update(delta: number) {
    this.atkCooldown  = Math.max(0, this.atkCooldown  - delta)
    this.rollCooldown = Math.max(0, this.rollCooldown - delta)
    if (this._tempSpeedTimer > 0) {
      this._tempSpeedTimer -= delta
      if (this._tempSpeedTimer <= 0) { this._tempSpeedTimer = 0; this._tempSpeedBonus = 0 }
    }
    if (this._daggerComboTimer > 0) {
      this._daggerComboTimer -= delta
      if (this._daggerComboTimer <= 0) { this._daggerComboTimer = 0; this._daggerComboCount = 0 }
    }
    if (this._tempDamageTimer > 0) {
      this._tempDamageTimer -= delta
      if (this._tempDamageTimer <= 0) { this._tempDamageTimer = 0; this._tempDamageMult = 1; this.clearTint() }
    }
    if (this._smokeTimer > 0) {
      this._smokeTimer -= delta
      if (this._smokeTimer <= 0) { this._smokeTimer = 0; this._smokeActive = false; this.setAlpha(1) }
    }

    const { damage: dotDamage, slowMult } = tickStatuses(this._statusEffects, delta)
    this._playerSlowMult = slowMult
    this._statusEffects = pruneExpired(this._statusEffects)
    if (dotDamage > 0) {
      this.hp = Math.max(0, this.hp - dotDamage)
      this.hpTimer = this.HP_SHOW_MS
      if (this.hp <= 0) { this.scene.events.emit('player-dead'); return }
    }

    if (this.hpTimer > 0) {
      this.hpTimer -= delta
      this.drawHpAboveHead()
      if (this.hpTimer <= 0) this.hpGfx.clear()
    }

    if (this.isRolling) return

    let vx = 0, vy = 0
    if (this.keys.left.isDown  || this.cursors.left.isDown)  vx -= 1
    if (this.keys.right.isDown || this.cursors.right.isDown) vx += 1
    if (this.keys.up.isDown    || this.cursors.up.isDown)    vy -= 1
    if (this.keys.down.isDown  || this.cursors.down.isDown)  vy += 1

    if (this.touchMoveId !== -1) {
      const dx = this.touchCurrent.x - this.touchOrigin.x
      const dy = this.touchCurrent.y - this.touchOrigin.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > 12) { vx += dx / d; vy += dy / d }
    }

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy)
      const nx = vx / len, ny = vy / len
      const castMult = (this.currentWeapon.projectile && this.atkCooldown > 0) ? 0.65 : 1
      this.setVelocity(nx * this.moveSpeed * castMult, ny * this.moveSpeed * castMult)
      this.facingAngle = Math.atan2(ny, nx)
      if (vx !== 0) this.setFlipX(vx < 0)
    } else {
      this.setVelocity(0, 0)
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) this.triggerAttack()
    if (Phaser.Input.Keyboard.JustDown(this.keys.roll))   this.triggerRoll()
    if (Phaser.Input.Keyboard.JustDown(this.keys.swap))   this.swapWeapon()

    // Ability E
    if (this._activeClass && this._abilityEKey) {
      if (this._activeClass === 'ranger') {
        if (Phaser.Input.Keyboard.JustDown(this._abilityEKey) && this._abilityCdE <= 0) {
          this._isAimingShot = true
          this._aimCharge = 0
        }
        if (this._isAimingShot) {
          this._aimCharge = Math.min(1, this._aimCharge + delta / 1000)
          if (!this._abilityEKey.isDown) {
            this.scene.events.emit('class-ability-e', {
              class: 'ranger', x: this.x, y: this.y,
              angle: this.facingAngle, charge: this._aimCharge,
            })
            this._abilityCdE = this._abilityCdEMax
            this._isAimingShot = false
            this._aimCharge = 0
          }
        }
      } else {
        if (Phaser.Input.Keyboard.JustDown(this._abilityEKey) && this._abilityCdE <= 0) {
          this.scene.events.emit('class-ability-e', {
            class: this._activeClass, x: this.x, y: this.y, angle: this.facingAngle,
          })
          this._abilityCdE = this._abilityCdEMax
        }
      }
    }

    // Ability R
    if (this._activeClass && this._abilityRKey) {
      if (Phaser.Input.Keyboard.JustDown(this._abilityRKey) && this._abilityCdR <= 0) {
        this.scene.events.emit('class-ability-r', {
          class: this._activeClass, x: this.x, y: this.y, angle: this.facingAngle,
        })
        this._abilityCdR = this._abilityCdRMax
      }
    }

    // Tick ability cooldowns
    if (this._abilityCdE > 0) this._abilityCdE = Math.max(0, this._abilityCdE - delta)
    if (this._abilityCdR > 0) this._abilityCdR = Math.max(0, this._abilityCdR - delta)
    if (this._mageManaShieldCd > 0) this._mageManaShieldCd = Math.max(0, this._mageManaShieldCd - delta)
  }

  takeDamage(amount: number): boolean {
    if (this.isRolling) return false
    // Mana Shield: 40% chance to absorb one hit per 5s
    if (this._mageManaShield && this._mageManaShieldCd <= 0 && Math.random() < 0.4) {
      this._mageManaShieldCd = 5000
      this.scene.events.emit('mana-shield-absorbed', { x: this.x, y: this.y })
      return false
    }
    const armorTotal = this.inventory.getStats().armor + (this._cosmeticBonus.armor ?? 0) + this._skillArmorBonus
    const reduced = Math.max(1, Math.round(amount * (1 - armorTotal / 100)))
    // Shield absorption
    if (this._shieldHp > 0) {
      const absorbed = Math.min(this._shieldHp, reduced)
      this._shieldHp -= absorbed
      const leftover = reduced - absorbed
      if (leftover <= 0) {
        this.setTint(0x4488ff)
        this.scene.time.delayedCall(150, () => { if (this.active && this.hp > 0) this.restoreCosmeticTint() })
        return false
      }
      this.hp = Math.max(0, this.hp - leftover)
      if (leftover > 0 && this.inventory.getActiveSets().includes('iron')) {
        this.scene.events.emit('reflect-damage', Math.max(1, Math.round(leftover * 0.08)))
      }
    } else {
      this.hp = Math.max(0, this.hp - reduced)
      if (this.inventory.getActiveSets().includes('iron')) {
        this.scene.events.emit('reflect-damage', Math.max(1, Math.round(reduced * 0.08)))
      }
    }
    this.hpTimer = this.HP_SHOW_MS
    this.scene.events.emit('player-took-damage')
    this.setTint(0xff3333)
    this.scene.time.delayedCall(200, () => { if (this.active && this.hp > 0) this.restoreCosmeticTint() })
    if (this.hp <= 0 && this._lastStandAvailable) {
      this.hp = 1
      this._lastStandAvailable = false
      this.setTint(0xffffff)
      this.scene.time.delayedCall(300, () => { if (this.active) this.restoreCosmeticTint() })
      return false
    }
    if (this.hp <= 0) this.scene.events.emit('player-dead')
    return this.hp <= 0
  }

  useConsumable(item: ItemDef) {
    if (item.healAmount)                        this.heal(item.healAmount)
    if (item.speedBoostAmt && item.speedBoostMs) {
      this._tempSpeedBonus = Math.max(this._tempSpeedBonus, item.speedBoostAmt)
      this._tempSpeedTimer = Math.max(this._tempSpeedTimer, item.speedBoostMs)
    }
    if (item.shieldAmount) this._shieldHp += item.shieldAmount
    if (item.damageBoostPct && item.damageBoostMs) {
      this._tempDamageMult = Math.max(this._tempDamageMult, 1 + item.damageBoostPct)
      this._tempDamageTimer = Math.max(this._tempDamageTimer, item.damageBoostMs)
      this.setTint(0xffee44)
    }
    if (item.smokeEffect) {
      this._smokeActive = true
      this._smokeTimer = 3000
      this.setAlpha(0.3)
    }
    this.hpTimer = this.HP_SHOW_MS
  }

  heal(amount: number) {
    this.hp = Math.min(this.effectiveMaxHp, this.hp + amount)
    this.hpTimer = this.HP_SHOW_MS
  }

  private drawHpAboveHead() {
    const pct = this.hp / this.effectiveMaxHp
    const bw = 30
    this.hpGfx.clear()
    this.hpGfx.fillStyle(0x220000)
    this.hpGfx.fillRect(this.x - bw / 2, this.y - 30, bw, 5)
    this.hpGfx.fillStyle(pct > 0.5 ? 0x44ee44 : pct > 0.25 ? 0xeecc00 : 0xee2222)
    this.hpGfx.fillRect(this.x - bw / 2, this.y - 30, bw * pct, 5)
  }

  destroy(fromScene = false) {
    this.hpGfx?.destroy()
    super.destroy(fromScene)
  }
}
