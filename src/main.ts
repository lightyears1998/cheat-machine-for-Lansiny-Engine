import yargs from "yargs/yargs";
import fs from "fs-extra";
import yaml from "js-yaml";

import {
  directionVector,
  ensureSourceAndOutput, getInitialAndTargetLocation, hideBin, make2DArray, saferOutputPath
} from "./util";
import {
  Actor, isBlockingItem, MapSourceJSON
} from "./entity";
import { GameMap, MapBlock } from "./entity";
import { identifyItem } from "./entity";
import { Game } from "./entity/Game";
import { Situation } from "./entity/Situation";
import { Graph } from "./entity/Graph";
const argv = yargs(hideBin(process.argv)).argv;

const help = "请看 README";

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
    map = new GameMap(10, actualHeight, actualWidth);

  } else {
    map = new GameMap(10, height, width);
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

  fs.writeFileSync(output, GameMap.dump(map));
} else if (command === "buildGame") {
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
    maps, initial, target, actor
  });

  fs.writeFileSync(output, Game.dump(game));
} else if (command === "run") {
  const gamePath = String(argv.game);
  const game = Game.load(fs.readFileSync(gamePath, { encoding: "utf-8" }));

  const initialSituation = new Situation();

  // 注册地图 ID
  game.maps.map(map => map.mapId).forEach(id => initialSituation.maps.add(id));

  // 对地图的每一部分进行连通分量分析
  const graphMap = initialSituation.graphs;

  let nextGraphId = 1;
  const registerGraph = (mapId: number, i: number, j: number) => {
    const graphId = nextGraphId++;
    const graph = new Graph();
    graph.mapId = mapId;
    graph.graphId = graphId;
    graph.firstItemLocation = [i, j];
    graphMap.set(graphId, graph);

    return graphId;
  };

  const connectGraph = (graphIdA: number, graphIdB: number) => {
    const graphA = graphMap.get(graphIdA) as Graph;
    const graphB = graphMap.get(graphIdB) as Graph;
    graphA.connectedGraphs.add(graphIdB);
    graphB.connectedGraphs.add(graphIdA);
  };

  for (const map of game.maps) {
    const {
      mapId, height, width, blocks
    } = map;

    const graphIdMarks = make2DArray(height, width, 0);
    for (let i = 0; i < height; ++i) {
      for (let j = 0; j < width; ++j) {
        if (!blocks[i][j].isPassable || graphIdMarks[i][j] !== 0) {
          continue;
        }

        graphIdMarks[i][j] = registerGraph(mapId, i, j);

        const queue = [[i, j]] as Array<[number, number]>;
        while (queue.length > 0) {
          const current = queue.shift() as [number, number];
          for (const v of directionVector) {
            const near = [current[0] + v[0], current[1] + v[1]];
            const [
              currentI,
              currentJ,
              nearI,
              nearJ
            ] = [...current, ...near];

            if (nearI >= 0 && nearI < height && nearJ >= 0 && nearJ < width && graphIdMarks[nearI][nearJ] === 0) {
              if (blocks[nearI][nearJ].isPassable) {
                if (!isBlockingItem(blocks[nearI][nearJ].item) && !isBlockingItem(blocks[currentI][currentJ].item)) {
                  graphIdMarks[nearI][nearJ] = graphIdMarks[currentI][currentJ];
                } else {
                  graphIdMarks[nearI][nearJ] = registerGraph(mapId, nearI, nearJ);
                  connectGraph(graphIdMarks[currentI][currentJ], graphIdMarks[nearI][nearJ]);
                }
                queue.push([nearI, nearJ]);
              }
            }
          }
        }
      }
    }

    if (argv.debugMark) {
      console.log(graphIdMarks);
    }

    for (let i = 0; i < height; ++i) {
      for (let j = 0; j < width; ++j) {
        const graphId = graphIdMarks[i][j];
        if (graphId) {
          const item = blocks[i][j].item;
          if (item) {
            const graph = graphMap.get(graphId) as Graph;
            graph.items.push(item);
          }
        }
      }
    }
  }

  if (argv.debugGraph) {
    console.dir(graphMap, { depth: null });
  }
} else {
  throw new Error("Unknown command.");
}
