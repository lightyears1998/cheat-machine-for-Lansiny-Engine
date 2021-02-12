import { Actor } from "./Actor";
import { Graph } from "./Graph";

export class Situation {
  currentGraphId!: number
  actor!: Actor

  maps: Set<number> = new Set()
  graphs: Map<number, Graph> = new Map()
  visitedGraphs: Set<number> = new Set()

  logs = ""

  static create({
    currentGraphId, maps, graphs
  }: Pick<Situation, "currentGraphId" | "maps" | "graphs">): Situation {
    const situation = new Situation();
    situation.currentGraphId = currentGraphId;
    situation.maps = maps;
    situation.graphs = graphs;
    return situation;
  }

  clone(): Situation {
    const neo = new Situation();
    neo.currentGraphId = this.currentGraphId;
    neo.actor = this.actor.clone();
    neo.maps = new Set(Array.from(this.maps.values()));
    neo.graphs = new Map();
    for (const graphId of Array.from(this.graphs.keys())) {
      const neoGraph = (this.graphs.get(graphId) as Graph).clone();
      neo.graphs.set(graphId, neoGraph);
    }
    neo.visitedGraphs = new Set(Array.from(this.visitedGraphs.values()));
    neo.logs = this.logs;

    return neo;
  }
}
