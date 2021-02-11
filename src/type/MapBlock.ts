import { Item } from "./Item";

export class MapBlock {
  item?: Item

  constructor(
    public x: number,
    public y: number,
    public isPassable: boolean
  ) { }
}
