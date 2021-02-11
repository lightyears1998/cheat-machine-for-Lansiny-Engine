import yaml from "js-yaml";

import { MapBlock } from "./MapBlock";

export class GameMap {
  mapId!: number
  height!: number
  width!: number
  blocks!: Array<Array<MapBlock>>

  constructor(mapId: number, height: number, width: number) {
    this.mapId = mapId;
    this.height = height;
    this.width = width;
    this.blocks = [[]];
    for (let i = 0; i < this.height; ++i) {
      this.blocks[i] = [];
    }
  }

  static create(data: Partial<GameMap>): GameMap {
    if (typeof data.mapId === "undefined") {
      throw new Error("Must specify mapId");
    }

    const gameMap = new GameMap(data.mapId, data.height ?? 0, data.width ?? 0);
    if (data.blocks) {
      gameMap.blocks = data.blocks;
    }
    return gameMap;
  }

  static dump(map: GameMap): string {
    return yaml.dump(map);
  }

  static load(str: string): GameMap {
    return GameMap.create(yaml.load(str) as GameMap);
  }
}
