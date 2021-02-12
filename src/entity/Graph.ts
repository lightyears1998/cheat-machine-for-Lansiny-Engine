import { Item } from ".";

export class Graph {
  mapId!: number
  graphId!: number
  firstItemLocation!: [number, number]

  items: Item[] = []
  connectedGraphs: Set<number> = new Set()
}
