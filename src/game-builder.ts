import path from "path";

import { Arguments } from "yargs";
import fs from "fs-extra";
import { isNumberString } from "class-validator";

import { Actor, GameMap } from "./entity";
import { getInitialAndTargetLocation } from "./util";
import { Game } from "./entity/Game";

export function buildGame(argv: Arguments): void {
  const mapIdsString = String(argv.map);
  const mapIds = mapIdsString.split("").filter(ch => isNumberString(ch) || ch === ",").join("").replace(/,/g, " ").replace(/\s+/g, " ").split(" ").map(id => Number(id));

  const [initial, target] = getInitialAndTargetLocation(String(argv.initial), String(argv.target));
  const gameName = String(argv._.shift());
  const gamePath = path.resolve(__dirname, `../var/${gameName}.yml`);

  const maps = [];
  for (const mapId of mapIds) {
    const mapPath = path.resolve(__dirname, `../var/Map${String(mapId).padStart(3, "0")}.yml`);
    const map = GameMap.load(fs.readFileSync(mapPath, { encoding: "utf-8" }));
    maps.push(map);
  }

  const actor = Actor.create({});

  const game = Game.create({
    maps, initialLocation: initial, targetLocation: target, actor
  });

  fs.writeFileSync(gamePath, Game.dump(game));
}
