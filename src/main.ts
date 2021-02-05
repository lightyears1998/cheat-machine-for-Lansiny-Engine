import path from "path";

import fs from "fs-extra";

const mapFile = fs.readFileSync(path.resolve(__dirname, "../data/Map011.json"), { encoding: "utf8" });
const map = JSON.parse(mapFile);

const st = new Set();
const data = map.data;

// function query(x: number, y: number) {
//   const offset = 6 * ((x - 1) * 25 + y - 1);
//   const res = [];
//   for (let i = 0; i < 6; ++i) {
//     res.push(data[offset + i]);
//   }
//   console.log(x, y, res);
// }

// for (let i = 1; i <= 25; ++i) {
//   query(12, i);
// }

let s = "";

for (let k = 0; k < 6; ++k) {
  for (let i = 0; i < 15; ++i) {
    for (let j = 0; j < 25; ++j) {
      s += data[k*15*25 + i*25 + j] + "\t\t";
    }
    s+="\n";
  }
  s += "\n\n";
}

fs.writeFileSync("./output.txt", s);
