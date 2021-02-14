import yargs from "yargs/yargs";

import { hideBin } from "./util";
import { buildMap } from "./map-converter";
import { buildGame } from "./game-builder";
import { runGame } from "./game-runner";

const helpMessage = "请看 README";

const argv = yargs(hideBin(process.argv)).argv;
const command = argv._.shift();

async function bootstrap() {
  if (!command) {
    console.log(helpMessage);
    return;
  }

  switch (command) {
    case "buildMap": {
      buildMap(argv);
      break;
    }

    case "buildGame": {
      buildGame(argv);
      break;
    }

    case "runGame": {
      runGame(argv);
      break;
    }

    default: throw "未知命令";
  }
}

bootstrap();
