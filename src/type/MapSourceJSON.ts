export type MapSourceJSON = {
  width: number,
  height: number,
  data: number[],
  events: {
    id: number,
    name: string,
    x: number,
    y: number
  }
}
