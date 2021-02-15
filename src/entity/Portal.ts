import { Item } from "./Item";
import { ItemType } from "./ItemType";

export class Portal extends Item {
  toMapId!: number
  toRow?: number
  toCol?: number
  toOriginalRow!: number
  toOriginalCol!: number

  static create(data: {type: ItemType, subtype: number, toMapId: number, toOriginalRow: number, toOriginalCol: number}): Portal {
    const ret = new Portal();
    ret.type = ItemType.PORTAL;
    ret.subtype = ItemType.PORTAL;
    ret.toMapId = data.toMapId;
    ret.toOriginalRow = data.toOriginalRow;
    ret.toOriginalCol = data.toOriginalCol;
    return ret;
  }
}
