export enum ItemType {
  ENEMY,
}

export class Item {
  constructor(
    public type: ItemType,
    public subtype: number
  ) {}
}
