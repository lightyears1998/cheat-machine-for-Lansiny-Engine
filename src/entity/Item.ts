import { UnaryExpression } from "typescript";

import { MapEvent } from "./MapSourceJSON";
import { ItemType } from "./ItemType";

import {
  BlueGemRank, DoorKeySubtype, getEnemyByName, PotionRank, RedGemRank
} from ".";

export class Item {
  type!: ItemType
  subtype!: number

  static create(data: Partial<Item>) {
    return Object.assign(new Item(), data);
  }
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
                  return Item.create({ type: ItemType.POTION, subtype: PotionRank.LV1 });
                } else if (rank === 2) {
                  return Item.create({ type: ItemType.POTION, subtype: PotionRank.LV2 });
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
      return Item.create({ type: ItemType.KEY, subtype: DoorKeySubtype.YELLOW });
    }

    case "蓝钥匙": {
      return Item.create({ type: ItemType.KEY, subtype: DoorKeySubtype.BLUE });
    }

    case "黄门": {
      return Item.create({ type: ItemType.DOOR, subtype: DoorKeySubtype.YELLOW });
    }

    case "蓝门": {
      return Item.create({ type: ItemType.DOOR, subtype: DoorKeySubtype.BLUE });
    }

    case "机关门": {
      return Item.create({ type: ItemType.DOOR, subtype: DoorKeySubtype.INGENIOUS_DOOR });
      // TODO 解读机关门细节
    }

    case "铁门": {
      return Item.create({ type: ItemType.DOOR, subtype: DoorKeySubtype.IRON_DOOR });
      // TODO 解读铁门细节
    }

    case "红宝石": {
      for (const page of event.pages) {
        for (const entry of page.list) {
          if (entry.code === 355) {
            for (const parameter of entry.parameters) {
              if (typeof parameter === "string" && parameter.startsWith("pickUpGem")) {
                const rank = parameter.substring("pickUpGem(".length).split(",")[0];
                if (rank === "1") {
                  return Item.create({ type: ItemType.RED_GEM, subtype: RedGemRank.LV1 });
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
                  return Item.create({ type: ItemType.BLUE_GEM, subtype: BlueGemRank.LV1 });
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

export function isBlockingItem(item?: Item) {
  if (!item) {
    return false;
  }

  return item.type === ItemType.ENEMY || item.type === ItemType.DOOR;
}
