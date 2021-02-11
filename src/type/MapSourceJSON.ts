export type MapEvent = {
  id: number
  name: string
  note: string
  x: number
  y: number
  pages: Array<{
    list: Array<{
      code: number,
      parameters: Array<number | string>
    }>
  }>
}

export type MapSourceJSON = {
  width: number,
  height: number,
  data: number[],
  events: Array<MapEvent | null>
}
