export function hideBin(argv: Array<string>): Array<string> {
  return argv.slice(2);
}

export function getMapFromJSON(json: string) {
  // Map0XX.json 的 data 字段是地图数据，width 字段和 height 字段指定宽高。
  // data 字段长度 width * height，分为 6 个切片，第三个切片通常可以观察出与地形的关联。
}
