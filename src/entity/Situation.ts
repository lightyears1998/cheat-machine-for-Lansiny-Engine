import { Graph } from "./Graph";

export class Situation {
  currentGraphId!: number

  maps: Set<number> = new Set()
  graphs: Map<number, Graph> = new Map()

  static create({
    currentGraphId, maps, graphs
  }: Pick<Situation, "currentGraphId" | "maps" | "graphs">) {
    const situation = new Situation();
    situation.currentGraphId = currentGraphId;
    situation.maps = maps;
    situation.graphs = graphs;
    return situation;
  }

  clone() {
    throw new Error("Not implement.");
  }
}
