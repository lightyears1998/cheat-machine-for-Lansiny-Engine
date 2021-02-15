import { ItemType } from "./ItemType";

export class Item {
  type!: ItemType
  subtype!: number

  static create(data: Partial<Item>): Item {
    return Object.assign(new Item(), data);
  }
}
