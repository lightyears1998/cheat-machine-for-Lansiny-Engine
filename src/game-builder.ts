import { Arguments } from "yargs";
import fs from "fs-extra";

import { Actor, GameMap } from "./entity";
import { getInitialAndTargetLocation, saferOutputPath } from "./util";
import { Game } from "./entity/Game";

export function buildGame(argv: Arguments) {
  const mapPaths = Array.isArray(argv.map) ? argv.map : [argv.map];
  const [initial, target] = getInitialAndTargetLocation(String(argv.initial), String(argv.target));
  const output = saferOutputPath(String(argv._.shift()));

  const maps = [];
  for (const path of mapPaths) {
    const map = GameMap.load(fs.readFileSync(path, { encoding: "utf-8" }));
    maps.push(map);
  }

  const actor = Actor.create({});

  const game = Game.create({
    maps, initialLocation: initial, targetLocation: target, actor
  });

  fs.writeFileSync(output, Game.dump(game));
}
