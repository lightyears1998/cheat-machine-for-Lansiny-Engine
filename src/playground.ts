import { Arguments } from "yargs";

import { getEnemyByName } from "./entity";

export function testFight(argv: Arguments) {
  const enemyName = String(argv.enemy);
  const enemy = getEnemyByName(enemyName);

  console.log(enemy);
}
