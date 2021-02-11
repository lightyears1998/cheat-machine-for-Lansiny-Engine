import { MapBlock } from "./MapBlock";

export class GameMap {
  blocks: Array<Array<MapBlock>>

  constructor(public height: number, public width: number) {
    this.blocks = [[]];
    for (let i = 0; i < this.height; ++i) {
      this.blocks[i] = [];
    }
  }
}
