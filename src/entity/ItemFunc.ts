import { isTemplateLiteralTypeNode } from "typescript";

import { DoorKeySubtype } from "./DoorKey";
import { getEnemyByName } from "./EnemyData";
import { BlueGemRank, RedGemRank } from "./Gem";
import { Item } from "./Item";
import { BlockingItemType, ItemType } from "./ItemType";
import { Portal } from "./Portal";
import { PotionRank } from "./Potion";
import { UpstreamMapEvent } from "./UpsteamMapJSON";

export function identifyItem(event: UpstreamMapEvent): Item | undefined {
  const [name] = event.name.split(" ");
  const { note } = event;

  switch (name) {
    case "有裂缝的墙": {
      return Item.create({ type: ItemType.BLOCKING, subtype: BlockingItemType.CRACKED_WALL });
    }

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
                } else if (rank === 3) {
                  return Item.create({ type: ItemType.POTION, subtype: PotionRank.LV3 });
                } else if (rank === 4) {
                  return Item.create({ type: ItemType.POTION, subtype: PotionRank.LV4 });
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

    case "上楼":
    case "下楼": {
      for (const page of event.pages) {
        for (const entry of page.list) {
          if (entry.code === 201) {
            const toMapId = Number(entry.parameters[1]);
            const toOriginalCol = Number(entry.parameters[2]);
            const toOriginalRow = Number(entry.parameters[3]);
            return Portal.create({
              type: ItemType.PORTAL,
              subtype: ItemType.PORTAL,
              toMapId,
              toOriginalRow: toOriginalRow,
              toOriginalCol: toOriginalCol
            });
          }
        }
      }
      break;
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

export function isBlockingItem(item?: Item): boolean {
  if (!item) {
    return false;
  }
  const itemType = item.type;

  const blockingItems = [
    ItemType.ENEMY,
    ItemType.DOOR,
    ItemType.PORTAL,
    ItemType.BLOCKING
  ];
  return blockingItems.includes(itemType);
}

export function isBuffOrToolItem(item?: Item): boolean {
  if (!item) {
    return false;
  }
  const itemType = item.type;

  const toolItemTypes = [
    ItemType.RED_GEM,
    ItemType.BLUE_GEM,
    ItemType.KEY,
    ItemType.POTION,
    ItemType.PORTAL
  ];
  return toolItemTypes.includes(itemType);
}
