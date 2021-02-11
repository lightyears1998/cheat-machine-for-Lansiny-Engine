import { MapEvent } from "./MapSourceJSON";
import { ItemType } from "./ItemType";

import {
  BlueGemRank, DoorKeySubtype, getEnemyByName, PotionRank, RedGemRank
} from ".";

export class Item {
  constructor(
    public type: ItemType,
    public subtype: number
  ) {}
}

export function identifyItem(event: MapEvent): Item | undefined {
  const [name, level] = event.name.split(" ");
  const { note } = event;

  switch (name) {
    case "药水": {
      for (const page of event.pages) {
        for (const entry of page.list) {
          if (entry.code === 355) {
            for (const parameter of entry.parameters) {
              if (typeof parameter === "string" && parameter.startsWith("pickUpPotion")) {
                const rank = parseInt(parameter.substring("pickUpPotion(".length));
                if (rank === 1) {
                  return new Item(ItemType.POTION, PotionRank.LV1);
                } else if (rank === 2) {
                  return new Item(ItemType.POTION, PotionRank.LV2);
                }
                throw new Error("unknown Potion Level: " + JSON.stringify(entry));
              }
            }
          }
        }
      }
      break;
    }

    case "黄钥匙": {
      return new Item(ItemType.KEY, DoorKeySubtype.YELLOW);
    }

    case "蓝钥匙": {
      return new Item(ItemType.KEY, DoorKeySubtype.BLUE);
    }

    case "红宝石": {
      for (const page of event.pages) {
        for (const entry of page.list) {
          if (entry.code === 355) {
            for (const parameter of entry.parameters) {
              if (typeof parameter === "string" && parameter.startsWith("pickUpGem")) {
                const rank = parameter.substring("pickUpGem(".length).split(",")[0];
                if (rank === "1") {
                  return new Item(ItemType.RED_GEM, RedGemRank.LV1);
                }
                throw new Error("unknown Red GEM Level: " + JSON.stringify(entry));
              }
            }
          }
        }
      }
      break;
    }

    case "蓝宝石": {
      for (const page of event.pages) {
        for (const entry of page.list) {
          if (entry.code === 355) {
            for (const parameter of entry.parameters) {
              if (typeof parameter === "string" && parameter.startsWith("pickUpGem")) {
                const rank = parameter.substring("pickUpGem(".length).split(",")[0];
                if (rank === "1") {
                  return new Item(ItemType.BLUE_GEM, BlueGemRank.LV1);
                }
                throw new Error("unknown Blue GEM Level: " + JSON.stringify(entry));
              }
            }
          }
        }
      }
      break;
    }
  }

  if (note.startsWith("<enemy:")) {
    return getEnemyByName(name);
  }

  return undefined;
}
