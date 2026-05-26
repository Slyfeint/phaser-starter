import type { ItemDef } from './ItemDefs'

export const BAG_CAPACITY = 20

export class Bag {
  private items: ItemDef[] = []
  private _capacityBonus = 0

  setCapacityBonus(bonus: number) { this._capacityBonus = bonus }
  get capacity(): number { return BAG_CAPACITY + this._capacityBonus }
  get capacityBonus(): number { return this._capacityBonus }
  get usedCells(): number { return this.items.reduce((s, i) => s + i.bagSize, 0) }
  get freeCells(): number { return this.capacity - this.usedCells }

  canAdd(item: ItemDef): boolean { return this.freeCells >= item.bagSize }

  add(item: ItemDef): boolean {
    if (!this.canAdd(item)) return false
    this.items.push(item)
    return true
  }

  remove(index: number): ItemDef | null {
    if (index < 0 || index >= this.items.length) return null
    return this.items.splice(index, 1)[0]
  }

  getAll(): ItemDef[] { return [...this.items] }
  clear() { this.items = [] }

  serialize(): ItemDef[] { return [...this.items] }
  deserialize(data: ItemDef[]) { this.items = [...data] }
}
