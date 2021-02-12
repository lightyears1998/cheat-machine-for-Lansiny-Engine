import { Graph } from "./Graph";

export class Situation {
  currentMapId!: number
  currentGraphId!: number

  maps!: Set<number>
  graphs!: Map<number, Graph>

  static create({
    currentMapId, currentGraphId, maps, graphs
  }: Pick<Situation, "currentGraphId" | "currentMapId" | "maps" | "graphs">) {
    const situation = new Situation();
    situation.currentGraphId = currentMapId;
    situation.currentMapId = currentGraphId;
    situation.maps = maps;
    situation.graphs = graphs;
    return situation;
  }

  clone() {
    throw new Error("???");
  }
}
