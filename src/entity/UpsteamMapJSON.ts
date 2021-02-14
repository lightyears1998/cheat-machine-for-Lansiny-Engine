export type UpstreamMapEvent = {
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

export type UpstreamMap = {
  width: number,
  height: number,
  data: number[],
  events: Array<UpstreamMapEvent | null>
}
