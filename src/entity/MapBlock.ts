import { Item } from "./Item";

export class MapBlock {
  item?: Item

  constructor(
    /** 行偏移量 */ public x: number,
    /** 列偏移量 */ public y: number,
    public isPassable: boolean
  ) { }
}
