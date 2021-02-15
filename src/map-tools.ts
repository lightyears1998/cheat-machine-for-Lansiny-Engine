import path from "path";

import { isNumberString } from "class-validator";
import {
  plot, stack, Plot
} from "nodeplotlib";
import { Arguments } from "yargs";
import fs from "fs-extra";

import { GameMap } from "./entity";

export function inspectMap(argv: Arguments): void {
  const mapIdsString = String(argv._.shift());
  const mapIds = mapIdsString
    .split("").filter(ch => isNumberString(ch) || ch === ",").join("")
    .replace(/,/g, " ").replace("/\s+/g", " ")
    .split(" ");

  for (const mapId of mapIds) {
    const mapFilePath = path.resolve(__dirname, `../var/Map${mapId.padStart(3, "0")}.yml`);
    const map = GameMap.load(fs.readFileSync(mapFilePath, { encoding: "utf8" }));
    const blocks = map.blocks.map(row => row.map(col => col.isPassable ? 1 : 0));

    const data: Plot[] = [
      {
        z: blocks,
        type: "heatmap"
      }
    ];
    stack(data, {
      title: map.name, height: 1024, width: 1024
    });
  }

  plot();
}
