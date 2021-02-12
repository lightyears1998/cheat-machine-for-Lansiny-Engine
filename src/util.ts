import { isNumberString } from "class-validator";

import { GameLocation } from "./entity/Game";

export const directionVector = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1]
] as Array<[number, number]>;

export function make2DArray<T = undefined>(height: number, width: number, initial: T): Array<Array<T>> {
  const arr = [] as Array<Array<T>>;
  for (let i = 0; i < height; ++i) {
    arr[i] = [];
    for (let j = 0; j < width; ++j) {
      arr[i][j] = initial;
    }
  }
  return arr;
}

export function hideBin(argv: Array<string>): Array<string> {
  return argv.slice(2);
}

export function ensureSourceAndOutput(source: string | number | undefined, output: string | number | undefined): [string, string] {
  if (!source || !output) {
    throw new Error("Must specify source and output file");
  }

  return [String(source), String(output)];
}

export function saferOutputPath(output: string | undefined): string {
  if (!output) {
    throw new Error("Must specify output path");
  }

  if (!output.startsWith("./var/") && !output.startsWith("var/")) {
    throw new Error("Output path must start with \"var\" in case of miss typed");
  }

  return output;
}

export function getInitialAndTargetLocation(initial: string, target: string): [GameLocation, GameLocation] {
  return [getGameLocation(initial), getGameLocation(target)];
}

export function getGameLocation(locationString: string): GameLocation {
  const location = locationString.split("").filter(ch => isNumberString(ch) || ch === ",").join("").replace(/,/g, " ").split(/\s+/g);
  return {
    mapId: Number(location[0]), row: Number(location[1]), col: Number(location[2])
  };
}
