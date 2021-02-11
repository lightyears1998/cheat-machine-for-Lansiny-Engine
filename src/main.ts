import yargs from "yargs/yargs";
import fs from "fs-extra";
import yaml from "js-yaml";

import {
  ensureSourceAndOutput, hideBin, saferOutputPath
} from "./util";
import { MapSourceJSON } from "./type";
import { GameMap, MapBlock } from "./type";
import { identifyItem } from "./data";
const argv = yargs(hideBin(process.argv)).argv;

const help = "buildMapFromJSON source.json map.json --auto-truncate";

const command = argv._.shift();

if (!command) {
  console.log(help);
} else if (command === "buildMapFromJSON") {
  let source = argv._.shift();
  let output = argv._.shift();
  [source, output] = ensureSourceAndOutput(source, output);
  saferOutputPath(output);

  const autoTruncate = argv.autoTruncate as boolean;

  const sourceMapFile = fs.readFileSync(source, { encoding: "utf-8" });
  const sourceMapJSON: MapSourceJSON = JSON.parse(sourceMapFile);

  const {
    height, width, data, events
  } = sourceMapJSON;
  let map: GameMap;

  let [
    startX,
    startY,
    endX,
    endY
  ] = [
    0,
    0,
    height - 1,
    width - 1
  ] as number[];

  if (autoTruncate) {
    // GameMap.data 数组长度 6 * height * width
    // 偏移量 3 * height * width 处为地图图层，可获知图块可否穿过。
    let started = false, ended = false;

    for (let i = 0; i < height && !started; ++i) {
      for (let j = 0; j < width && !started; ++j) {
        const datum = data[3 * height * width + i * width + j];
        if (datum !== 0) {
          startX = i, startY = j;
          started = true;
        }
      }
    }

    for (let i = height - 1; i >= 0 && !ended; --i) {
      for (let j = width - 1; j >= 0 && !ended; --j) {
        const datum = data[4 * height * width - 1 - (width - 1 - j) - width * (height - 1 - i)];
        if (datum !== 0) {
          endX = i, endY = j;
          ended = true;
        }
      }
    }

    const [actualHeight, actualWidth] = [endX - startX + 1, endY - startY + 1];
    map = new GameMap(actualHeight, actualWidth);

  } else {
    map = new GameMap(height, width);
  }

  const blocks = map.blocks;
  for (let i = 0; i <= endX - startX; ++i) {
    for (let j = 0; j <= endY - startY; ++j) {
      const pos = 3 * height * width + width * (startX + i) + startY + j;
      blocks[i][j] = new MapBlock(i, j, data[pos] === 584);
    }
  }

  for (const event of events) {
    if (event != null) {
      const { x, y } = event;
      const [i, j] = [y, x];

      if (startX <= i && i <= endX && startY <= j && j <= endY) {
        const item = identifyItem(event);
        blocks[i - startX][j - startY].item = item;
      }
    }
  }

  fs.writeFileSync(output, yaml.dump(map));
} else {
  throw new Error("Unknown command.");
}
