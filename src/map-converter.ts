import path from "path";

import fs from "fs-extra";
import { Arguments } from "yargs";

import { UpstreamMap } from "./entity";
import { GameMap, MapBlock } from "./entity";
import { identifyItem } from "./entity";
import { UpstreamMapInfo, UpstreamMapInfos } from "./entity/UpstreamMapInfosJSON";

export function convertMap(argv: Arguments): void {
  const autoTruncate = (argv.autoTruncate ?? true) as boolean;

  const mapInfos = readMapInfos().filter(info => info != null) as Array<UpstreamMapInfo>;

  for (const info of mapInfos) {
    const { id, name } = info;
    const basename = `Map${String(id).padStart(3, "0")}`;

    const sourceMapFilepath = path.resolve(__dirname, `../var/upstream/${basename}.json`);
    const outputMapFilepath = path.resolve(__dirname, `../var/${basename}.yml`);

    const sourceMapFile = fs.readFileSync(sourceMapFilepath, { encoding: "utf-8" });
    const sourceMap: UpstreamMap = JSON.parse(sourceMapFile);

    const {
      height, width, data, events
    } = sourceMap;

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
      let started = false, ended = false;

      // GameMap.data 数组长度 6 * height * width
      // 偏移量 3 * height * width 处为地图图层，可获知图块可否穿过。
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
      map = new GameMap(id, name, actualHeight, actualWidth, {
        originHeight: height,
        originWidth: width,
        truncateRowStart: startX,
        truncateRowEnd: endX,
        truncateColumnStart: startY,
        truncateColumnEnd: endY
      });
    } else {
      map = new GameMap(id, name, height, width, {
        originHeight: height,
        originWidth: width,
        truncateRowStart: 0,
        truncateRowEnd: height - 1,
        truncateColumnStart: 0,
        truncateColumnEnd: width - 1
      });
    }

    const blocks = map.blocks;
    const passableBlocks = [584];
    for (let i = 0; i <= endX - startX; ++i) {
      for (let j = 0; j <= endY - startY; ++j) {
        const pos = 3 * height * width + width * (startX + i) + startY + j;
        blocks[i][j] = new MapBlock(i, j, passableBlocks.includes(data[pos]));
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

    fs.writeFileSync(outputMapFilepath, GameMap.dump(map));
  }
}

function readMapInfos(): UpstreamMapInfos {
  const mapInfoJSON = fs.readFileSync(path.resolve(__dirname, "../var/upstream/MapInfos.json"), { encoding: "utf8" });
  return JSON.parse(mapInfoJSON);
}
