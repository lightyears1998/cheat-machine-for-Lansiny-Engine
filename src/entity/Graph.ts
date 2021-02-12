import { Item } from ".";

export class Graph {
  mapId!: number
  graphId!: number
  firstItemLocation!: [number, number]

  items: Item[] = []
  connectedGraphs: Set<number> = new Set()

  clone(): Graph {
    const neo = new Graph();
    neo.mapId = this.mapId;
    neo.graphId = this.graphId;
    neo.firstItemLocation = this.firstItemLocation;
    neo.items = this.items.slice();
    neo.connectedGraphs = new Set(Array.from(this.connectedGraphs.values()));

    return neo;
  }
}
