import { Actor } from "./Actor";
import { Graph } from "./Graph";

export class Situation {
  targetReached = false

  fromGraphId?: number
  currentGraphId!: number
  actor!: Actor

  maps: Set<number> = new Set()
  graphs: Map<number, Graph> = new Map()
  visitedGraphs: Set<number> = new Set()

  logs = ""

  get currentGraph(): Graph {
    return this.getGraphById(this.currentGraphId);
  }

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

  getGraphById(graphId: number): Graph {
    return this.graphs.get(graphId) as Graph;
  }

  clearVisitedGraph(): void {
    this.visitedGraphs = new Set();
  }
}
