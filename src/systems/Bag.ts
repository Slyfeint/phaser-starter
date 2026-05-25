import type { ItemDef } from './ItemDefs'

export const BAG_CAPACITY = 20

export class Bag {
  private items: ItemDef[] = []

  get usedCells(): number { return this.items.reduce((s, i) => s + i.bagSize, 0) }
  get freeCells(): number { return BAG_CAPACITY - this.usedCells }

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
