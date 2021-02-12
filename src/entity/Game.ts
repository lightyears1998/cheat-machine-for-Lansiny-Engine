import yaml from "js-yaml";

import { Actor } from "./Actor";
import { GameMap } from "./GameMap";

export class GameLocation {
  mapId!: number
  row!: number
  col!: number
}

export class Game {
  maps!: GameMap[]
  initial!: GameLocation
  target!: GameLocation
  actor!: Actor

  static create(data: Partial<Game>) {
    return Object.assign(new Game(), data);
  }

  static dump(game: Game): string {
    return yaml.dump(game);
  }

  static load(str: string): Game {
    return Game.create(yaml.load(str) as Game);
  }
}
