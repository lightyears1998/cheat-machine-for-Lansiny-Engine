import yargs from "yargs/yargs";

import { hideBin } from "./util";
import { convertMap } from "./map-converter";
import { buildGame } from "./game-builder";
import { runGame } from "./game-runner";
import { inspectMap } from "./map-tools";

const helpMessage = "请看 README";

const argv = yargs(hideBin(process.argv)).argv;
const command = argv._.shift();

async function bootstrap() {
  if (!command) {
    console.log(helpMessage);
    return;
  }

  switch (command) {
    case "convertMap": {
      convertMap(argv);
      break;
    }

    case "inspectMap": {
      inspectMap(argv);
      break;
    }

    case "buildGame": {
      buildGame(argv);
      break;
    }

    case "run": {
      runGame(argv);
      break;
    }

    default: throw "未知命令";
  }
}

bootstrap();
