import yaml from "js-yaml";

import { MapBlock } from "./MapBlock";

export class GameMap {
  mapId!: number
  name!: string
  height!: number
  width!: number
  blocks!: Array<Array<MapBlock>>

  originHeight!: number
  originWidth!: number
  truncateRowStart!: number
  truncateRowEnd!: number
  truncateColumnStart!: number
  truncateColumnEnd!: number

  graphIdMarks?: number[][]

  constructor(mapId: number, name: string, height: number, width: number, extra: {
    originHeight: number,
    originWidth: number,
    truncateRowStart: number
    truncateRowEnd: number
    truncateColumnStart: number
    truncateColumnEnd: number
  }) {
    this.mapId = mapId;
    this.name = name;
    this.height = height;
    this.width = width;
    this.blocks = [[]];
    for (let i = 0; i < this.height; ++i) {
      this.blocks[i] = [];
    }

    this.originHeight = extra.originHeight;
    this.originWidth = extra.originWidth;
    this.truncateRowStart = extra.truncateRowStart;
    this.truncateRowEnd = extra.truncateRowEnd;
    this.truncateColumnStart = extra.truncateColumnStart;
    this.truncateColumnEnd = extra.truncateColumnEnd;
  }

  static create(data: GameMap): GameMap {
    if (typeof data.mapId === "undefined") {
      throw new Error("Must specify mapId");
    }

    const gameMap = new GameMap(
      data.mapId,
      data.name,
      data.height,
      data.width, {
        originHeight: data.originHeight,
        originWidth: data.originWidth,
        truncateColumnStart: data.truncateColumnStart,
        truncateColumnEnd: data.truncateColumnEnd,
        truncateRowStart: data.truncateRowStart,
        truncateRowEnd: data.truncateRowEnd
      });
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
