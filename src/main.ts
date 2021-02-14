import { inspect } from "util";
import { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } from "constants";

import yargs from "yargs/yargs";
import fs from "fs-extra";
import { updateTypeLiteralNode } from "typescript";

import {
  directionVector,
  ensureSourceAndOutput, getInitialAndTargetLocation, hideBin, make2DArray, saferOutputPath
} from "./util";
import {
  Actor, cumulativeExpRequiredForLevelUp, Enemy, isBlockingItem, isBuffOrToolItem, isPermanentItem, MapSourceJSON
} from "./entity";
import { GameMap, MapBlock } from "./entity";
import { identifyItem } from "./entity";
import { Game } from "./entity/Game";
import { Situation } from "./entity/Situation";
import { Graph } from "./entity/Graph";
import { ItemType } from "./entity/ItemType";
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
    map = new GameMap(11, actualHeight, actualWidth);

  } else {
    map = new GameMap(11, height, width);
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
    maps, initialLocation: initial, targetLocation: target, actor
  });

  fs.writeFileSync(output, Game.dump(game));
} else if (command === "run") {
  const gamePath = String(argv.game);
  const game = Game.load(fs.readFileSync(gamePath, { encoding: "utf-8" }));

  // 处理初始情况
  const initialSituation = new Situation();
  initialSituation.actor = new Actor();

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

    if (argv.debugGraph) {
      console.dir(graphMap, { depth: null });
    }

    // 确认游戏开始时所在的区块
    if (mapId === game.initialLocation.mapId) {
      const { row, col } = game.initialLocation;

      for (let i = 0; i < height; ++i) {
        for (let j = 0; j < width; ++j) {
          if (i === row && j === col) {
            const graphId = graphIdMarks[i][j];
            if (!graphId) {
              throw new Error("Initial position is possibly not reachable");
            }
            game.initialGraphId = graphId;
          }
        }
      }
    }
    initialSituation.currentGraphId = game.initialGraphId;

    // 确认游戏终结位置所在的区块
    if (mapId === game.targetLocation.mapId) {
      const { row, col } = game.targetLocation;

      for (let i = 0; i < height; ++i) {
        for (let j = 0; j < width; ++j) {
          if (i === row && j === col) {
            const graphId = graphIdMarks[i][j];
            if (!graphId) {
              throw new Error("Target position is possibly not reachable");
            }
            game.targetGraphId = graphId;
          }
        }
      }
    }

    if (!game.initialGraphId || !game.targetGraphId) {
      throw new Error("Fail to determine initial graph or target graph");
    }
    initialSituation.getGraphById(game.targetGraphId).couldBeMerged = false;

    // 收集区块内的物品
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

  // 推理过程
  let situations = [initialSituation] as Array<Situation>;
  const solutions = [] as Array<Situation>;
  let trial = 0, filter = 0, deadEnd = 0;
  let minGraphCount = situations[0].graphs.size;
  console.log(new Date(), "Origin graph size:", minGraphCount);

  const evaluate = (actor: Actor): number => {
    const expToUpgrade = cumulativeExpRequiredForLevelUp[actor.level + 1];
    return actor.hp + (actor.level) * 200 + (actor.level + 1) * 200 * (actor.exp / expToUpgrade) + actor.atk * 20 + actor.def * 20;
  };

  const handleGraphItems = (situation: Situation, graphId: number, logs: string[]) => {
    const actor = situation.actor;
    const graph = situation.getGraphById(graphId);

    for (let i = 0; i < graph.items.length; ++i) {
      const item = graph.items[i];
      const { type } = item;

      switch (type) {
        case ItemType.ENEMY: {
          actor.fight(item as Enemy);
          logs.push(`战胜了${(item as Enemy).name}；LEVEL: ${actor.level} HP：${actor.hp} EXP：${actor.exp} ATK: ${actor.atk} DEF: ${actor.def} GOLD：${actor.gold}`);
          situation.clearVisitedGraph();
          break;
        }

        case ItemType.RED_GEM: {
          const log = actor.handle(item);
          logs.push(log);
          situation.clearVisitedGraph();
          break;
        }

        case ItemType.BLUE_GEM: {
          const log = actor.handle(item);
          logs.push(log);
          situation.clearVisitedGraph();
          break;
        }

        case ItemType.DOOR: {
          const log = actor.handle(item);
          logs.push(log);
          break;
        }

        case ItemType.KEY: {
          const log = actor.handle(item);
          logs.push(log);
          situation.clearVisitedGraph();
          break;
        }

        case ItemType.POTION: {
          const log = actor.handle(item);
          logs.push(log);
          situation.clearVisitedGraph();
          break;
        }

        default: throw new Error("Unable to handle the item: " + JSON.stringify(item));
      }
    }

    // 销毁不是永久物品的物品
    graph.items = graph.items.filter(item => isPermanentItem(item));
  };

  const mergeGraphs = (situation: Situation, baseGraphId: number, branchGraphId: number) => {
    const baseGraph = situation.graphs.get(baseGraphId) as Graph;
    const branchGraph = situation.graphs.get(branchGraphId) as Graph;

    if (!branchGraph.couldBeMerged) {
      throw "目标区块不可被合并。";
    }

    for (const toGraphId of Array.from(branchGraph.connectedGraphs.values())) {
      const toGraph = situation.graphs.get(toGraphId) as Graph;
      baseGraph.connectedGraphs.add(toGraphId);
      toGraph.connectedGraphs.add(baseGraph.graphId);
      toGraph.connectedGraphs.delete(branchGraph.graphId);
    }
    baseGraph.connectedGraphs.delete(baseGraph.graphId);

    situation.graphs.delete(branchGraph.graphId);

    situation.currentGraphId = baseGraphId;
  };

  while (true) {
    if (situations.length === 0) {
      if (solutions.length > 0) {
        console.log("Found solution!");
        solutions.sort((a, b) => -(evaluate(a.actor) - evaluate(b.actor)));
        console.log("Possible solutions:", solutions.length, "\ttrial:", trial, "\tdead end:", deadEnd);

        const hpSet = new Set();
        for (let i = 0; i < solutions.length; ++i) {
          const hp = solutions[i].actor.hp;
          if (!hpSet.has(hp)) {
            console.log("final hp:", hp, solutions[i].logs);
            hpSet.add(hp);
          }
        }
      } else {
        console.log("Sorry but I can't find a solution.", "\ttrial:", trial, "\tdead end:", deadEnd, "\tfilter", filter);
      }
      break;
    }
    ++trial;

    const situation = situations.shift() as Situation;

    // 清理情况较差的分支
    if (situations.length > 160000) {
      let awaiting = situations.length, coefficient = 0.5;
      const totalPoints = situations.map(situation => situation.actor).reduce((ac, cur) => ac + evaluate(cur), 0);
      const averagePoints = totalPoints / awaiting;

      while (awaiting > 160000) {
        const baselinePoints = averagePoints * coefficient;
        situations = situations.filter(situation => evaluate(situation.actor) >= baselinePoints);

        filter += awaiting - situations.length;
        awaiting = situations.length;
        coefficient = coefficient * 1.025;

        if (argv.debugFilter) {
          console.log("filtering, baselinePoints:", baselinePoints, "filter:", filter, "awaiting:", awaiting);
        }
      }
    }

    // 层数报告
    if (Math.min(situation.graphs.size, minGraphCount) !== minGraphCount) {
      minGraphCount = situation.graphs.size;

      const candidates = [situation, ...situations];

      let maxPoints = 0;
      for (const candidate of candidates) {
        maxPoints = Math.max(evaluate(candidate.actor), maxPoints);
      }

      const maxSituation = candidates.filter(situation => evaluate(situation.actor) === maxPoints);

      console.log(new Date(), "graph size:", minGraphCount, "awaiting:", situations.length, "filter:", filter, `\n${maxSituation[0].logs}`);
    }

    // 开始报告
    const logs = [];

    // 记录到达位置
    logs.push(`移动到${situation.currentGraph.firstItemLocation} (id: ${situation.currentGraphId})`);

    // 处理当前区域的物品
    handleGraphItems(situation, situation.currentGraphId, logs);

    // 判断当前是否位于目标区域
    situation.visitedGraphs.add(situation.currentGraphId);
    if (situation.currentGraphId === game.targetGraphId) {
      solutions.push(situation);
      continue;
    }

    // 聚合连通分量
    if (situation.fromGraphId && situation.currentGraph.couldBeMerged /** TODO && 是可以聚合的区块 */) {
      mergeGraphs(situation, situation.fromGraphId, situation.currentGraphId);
    }

    // 拓张到相邻区块
    while (true) {
      let mergedCount = 0;

      for (const nearGraphId of Array.from(situation.currentGraph.connectedGraphs.values())) {
        const nearGraph = situation.getGraphById(nearGraphId);
        if (!situation.visitedGraphs.has(nearGraphId) && (!nearGraph.items[0] || isBuffOrToolItem(nearGraph.items[0]))) {
          if (nearGraph.couldBeMerged) {
            handleGraphItems(situation, nearGraphId, logs);
            mergeGraphs(situation, situation.currentGraphId, nearGraphId);
            situation.visitedGraphs.add(nearGraphId);
            ++mergedCount;
          }
        }
      }

      if (mergedCount === 0) {
        break;
      }
    }

    // 结束报告
    situation.logs += "# " + logs.join("；") + "\n";

    // 决定下一步方向
    if (/* 如果是传送门并且目标位置没有访问过 */ false) {
      // 强制传送到目标地点
    } else {
      let hasNext = false;

      // 在相邻区块中选择方向
      for (const nextGraphId of Array.from(situation.currentGraph.connectedGraphs)) {
        const nextGraph = situation.getGraphById(nextGraphId);
        const firstItem = nextGraph.items[0];

        if (!situation.visitedGraphs.has(nextGraphId) && situation.actor.couldHandle(firstItem)) {
          const nextSituation = situation.clone();
          nextSituation.fromGraphId = situation.currentGraph.graphId;
          nextSituation.currentGraphId = nextGraphId;
          situations.push(nextSituation);
          hasNext = true;
        }
      }

      // 如果无法进行下一步则判定为困毙
      if (!hasNext) {
        ++deadEnd;
      }
    }
  }
} else {
  throw new Error("Unknown command.");
}
