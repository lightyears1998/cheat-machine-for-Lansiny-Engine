import path from "path";

import { table } from "table";
import { Arguments } from "yargs";
import fs from "fs-extra";

import { Game } from "./entity/Game";
import {
  Actor, cumulativeExpRequiredForLevelUp, Enemy, Graph, isBlockingItem, isBuffOrToolItem, ItemType, Portal, Situation
} from "./entity";
import { directionVector, make2DArray } from "./util";
import { Fighter } from "./entity/Fighter";

export function runGame(argv: Arguments): void {
  const gameName = String(argv._.shift());
  const gamePath = path.resolve(__dirname, `../var/${gameName}.yml`);
  const game = Game.load(fs.readFileSync(gamePath, { encoding: "utf-8" }));

  // 处理初始情况
  const initialSituation = new Situation();
  initialSituation.actor = Actor.create(game.actor);

  // 注册地图 ID
  game.maps.map(map => map.mapId).forEach(id => initialSituation.maps.add(id));

  // 注册连通分量
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

  // 对每张地图进行连通分量分析
  for (const map of game.maps) {
    const {
      mapId, height, width, blocks
    } = map;

    const graphIdMarks = map.graphIdMarks = make2DArray(height, width, 0);
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
                  queue.push([nearI, nearJ]);
                }
              }
            }
          }
        }
      }
    }

    for (let i = 0; i < height; ++i) {
      for (let j = 0; j < width; ++j) {
        const item = blocks[i][j].item;
        if (item && isBlockingItem(item)) {
          graphIdMarks[i][j] = registerGraph(mapId, i, j);
          for (const v of directionVector) {
            const nearI = i + v[0], nearJ = j + v[1];
            if (graphIdMarks[nearI][nearJ] !== 0) {
              connectGraph(graphIdMarks[i][j], graphIdMarks[nearI][nearJ]);
            }
          }
        }
      }
    }

    if (argv.debugMark) {
      console.log(map.name, "mapId:", map.mapId);
      console.log(table(graphIdMarks));
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

  // 检查起始位置和目标位置
  if (!game.initialGraphId || !game.targetGraphId) {
    throw new Error("Fail to determine initial graph or target graph");
  }

  // 处理地图上的传送门
  for (const fromGraph of Array.from(initialSituation.graphs.values())) {
    const firstItem = fromGraph.items[0];

    if (firstItem && firstItem.type === ItemType.PORTAL) {
      const portal = firstItem as Portal;
      const toMapId = portal.toMapId;
      const toMap = game.maps.filter(map => map.mapId === toMapId)[0];

      if (toMap) {
        const { toOriginalRow, toOriginalCol } = portal;
        const { truncateRowStart, truncateColumnStart } = toMap;
        const toX = toOriginalRow - truncateRowStart;
        const toY = toOriginalCol - truncateColumnStart;
        const toGraphId = (toMap.graphIdMarks as number[][])[toX][toY];
        const toGraph = initialSituation.graphs.get(toGraphId);
        if (toGraph) {
          connectGraph(fromGraph.graphId, toGraph.graphId);
        }
      }

      fromGraph.items.shift();  // 消耗此传送门
    }
  }

  // 推理过程
  let situations = [initialSituation.clone()] as Array<Situation>;
  const solutions = [] as Array<Situation>;
  let trial = 0, filter = 0, deadEnd = 0;
  let minGraphCount = situations[0].graphs.size;
  console.log(new Date(), "原始区块数量：", minGraphCount);

  const evaluateFighter = (figher: Fighter): number => {
    return figher.hp * 5 + figher.atk * 20 + figher.def * 20;
  };

  const evaluateActor = (actor: Actor): number => {
    const fighterPoints = evaluateFighter(actor);

    const expToUpgrade = cumulativeExpRequiredForLevelUp[actor.level + 1];
    const levelPoints = (((actor.level + 1) * 200 + actor.hp * 0.2) * (actor.exp / expToUpgrade)) * 5;

    const goldPoints = actor.gold * 1.5;

    return fighterPoints + levelPoints + goldPoints;
  };

  const evaluateSituation = (situation: Situation): number => {
    const actorPoints = evaluateActor(situation.actor);
    return actorPoints + situation.destroyedEnemyPoints;
  };

  const handleGraphItems = (situation: Situation, graphId: number, logs?: string[]) => {
    logs = logs ?? [];
    const actor = situation.actor;
    const graph = situation.getGraphById(graphId);

    for (let i = 0; i < graph.items.length; ++i) {
      const item = graph.items[i];
      const { type } = item;

      switch (type) {
        case ItemType.ENEMY: {
          const enemy = item as Enemy;

          actor.fight(enemy);
          logs.push(`战胜了${(item as Enemy).name}；LEVEL: ${actor.level} HP：${actor.hp} EXP：${actor.exp} ATK: ${actor.atk} DEF: ${actor.def} GOLD：${actor.gold}`);

          const enemyPoints = evaluateFighter(enemy);
          situation.destroyedEnemyPoints += enemyPoints;
          break;
        }

        case ItemType.RED_GEM: {
          const log = actor.handle(item);
          logs.push(log);
          break;
        }

        case ItemType.BLUE_GEM: {
          const log = actor.handle(item);
          logs.push(log);
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
          break;
        }

        case ItemType.POTION: {
          const log = actor.handle(item);
          logs.push(log);
          break;
        }

        default: throw new Error("Unable to handle the item: " + JSON.stringify(item));
      }
    }

    // 销毁掉当前节点上的所有物品
    graph.items = [];
  };

  const mergeGraphs = (situation: Situation, baseGraphId: number, branchGraphId: number) => {
    const baseGraph = situation.graphs.get(baseGraphId) as Graph;
    const branchGraph = situation.graphs.get(branchGraphId) as Graph;

    if (branchGraph.graphId === game.targetGraphId) {
      situation.targetReached = true;
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

  const logPosition = (situation: Situation, graphId: number, logs?: string[]) => {
    logs = logs ?? [];

    const graph = situation.graphs.get(graphId) as Graph;
    const mapId = graph.mapId;
    const mapName = game.maps.filter(map => map.mapId === mapId)[0].name;
    logs.push(`移动到${graph.firstItemLocation} [${mapName}] (mapId: ${mapId} graphId: ${graph.graphId})`);
  };

  const printLogs = (graphPath: number[]) => {
    const situation = initialSituation.clone();
    const logs = [] as string[];

    for (const graphId of graphPath) {
      const graphlogs = [] as string[];
      logPosition(situation, graphId, graphlogs);
      handleGraphItems(situation, graphId, graphlogs);
      if (graphlogs.length > 1) {
        logs.push(`# ${graphlogs.join("；")}`);
      }
    }

    return logs.join("\n");
  };

  while (true) {
    if (situations.length === 0) {
      if (solutions.length > 0) {
        console.log("找到解法！");
        solutions.sort((a, b) => -(evaluateSituation(a) - evaluateSituation(b)));
        console.log("可行解数量：", solutions.length, "计算节点数量：", trial, "失败次数：", deadEnd, "排除节点数量：", filter);

        const hpSet = new Set();
        for (let i = 0; i < solutions.length; ++i) {
          const hp = solutions[i].actor.hp;
          if (!hpSet.has(hp)) {
            console.log("最终生命值：", hp, printLogs(situations[i].graphPath));
            hpSet.add(hp);
          }
        }
      } else {
        console.log("未能找到解决方案QAQ", "计算节点数量：", trial, "失败次数：", deadEnd, "排除节点数量：", filter);
      }
      break;
    }

    // 清理情况较差的分支
    if (situations.length > 16384) {
      let awaiting = situations.length;

      situations = situations.sort((a, b) => -(evaluateSituation(a) - evaluateSituation(b))).slice(0, 8192);
      filter += awaiting - situations.length;
      awaiting = situations.length;

      if (argv.debugFilter) {
        console.log("触发过滤", "已过滤：", filter, "队列中：", awaiting);
      }
    }

    ++trial;
    const situation = situations.shift() as Situation;

    // 层数报告
    if (Math.min(situation.graphs.size, minGraphCount) !== minGraphCount) {
      minGraphCount = situation.graphs.size;

      const candidates = [situation, ...situations];

      let maxPoints = 0;
      for (const candidate of candidates) {
        maxPoints = Math.max(evaluateSituation(candidate), maxPoints);
      }

      const maxSituation = candidates.filter(situation => evaluateSituation(situation) === maxPoints)[0];

      console.log(new Date(), "节点数量：", minGraphCount, "队列中：", situations.length, "已过滤", filter, `\n${printLogs(maxSituation.graphPath)}`);
      console.log("角色分数：", evaluateActor(maxSituation.actor), "消灭敌人分数：", maxSituation.destroyedEnemyPoints);
    }

    // 记录到达位置
    situation.graphPath.push(situation.currentGraphId);

    // 处理当前区域的物品
    handleGraphItems(situation, situation.currentGraphId);

    // 判断是否抵达目标区域
    if (situation.currentGraphId === game.targetGraphId) {
      situation.targetReached = true;
    }

    // 聚合连通分量
    if (situation.fromGraphId) {
      mergeGraphs(situation, situation.fromGraphId, situation.currentGraphId);
    }

    // 拓张到相邻区块
    while (true) {
      let mergedCount = 0;

      for (const nearGraphId of Array.from(situation.currentGraph.connectedGraphs.values())) {
        const nearGraph = situation.getGraphById(nearGraphId);
        if (!nearGraph.items[0] || isBuffOrToolItem(nearGraph.items[0])) {
          handleGraphItems(situation, nearGraphId);
          mergeGraphs(situation, situation.currentGraphId, nearGraphId);
          situation.graphPath.push(nearGraph.graphId);
          ++mergedCount;
        }
      }

      if (mergedCount === 0) {
        break;
      }
    }

    // 判断是否到达目标地点
    if (situation.targetReached) {
      solutions.push(situation);
      continue;
    }

    // 决定下一步方向
    let hasNext = false;

    // 在相邻区块中选择方向
    for (const nextGraphId of Array.from(situation.currentGraph.connectedGraphs)) {
      const nextGraph = situation.getGraphById(nextGraphId);
      const firstItem = nextGraph.items[0];

      if (situation.actor.couldHandle(firstItem)) {
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
