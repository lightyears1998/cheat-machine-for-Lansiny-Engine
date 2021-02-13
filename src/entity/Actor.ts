import { DoorKeySubtype } from "./DoorKey";
import { Enemy } from "./Enemy";
import { Fighter } from "./Fighter";
import { Item } from "./Item";
import { ItemType } from "./ItemType";
import { getPotionEffect } from "./Potion";
import { skillData } from "./SkillData";

export const expRequiredForLevelUp: Record<string, number> = {
  0: 0,
  1: 10,
  2: 30,
  3: 50,
  4: 80,
  5: 120,
  6: 160,
  7: 200,
  8: 250,
  9: 300,
  10: 350
};

const levels = Object.keys(expRequiredForLevelUp).map(k => Number(k)).sort((a, b) => a - b);

const cumulativeExpRequiredForLevelUp: Record<string, number> = { 0: 0 };
for (let level = 1; level < levels.length; ++level) {
  cumulativeExpRequiredForLevelUp[level] = expRequiredForLevelUp[level] + cumulativeExpRequiredForLevelUp[level - 1];
}

export class Actor implements Fighter {
  // 属性
  level = 0
  hp = 10
  atk = 0
  def = 0
  exp = 0
  gold = 0

  // 技能
  skill = {
    beforeBattle: "",
    attack: "普通攻击",
    defense: "无防御",
    afterBattle: ""
  }

  // 物品栏
  keyYellow = 0
  keyBlue = 0
  keyRed = 0

  static create(data: Partial<Actor>): Actor {
    return Object.assign(new Actor(), data);
  }

  clone(): Actor {
    const neo = new Actor();

    neo.level = this.level;
    neo.hp = this.hp;
    neo.atk = this.atk;
    neo.def = this.def;
    neo.exp = this.exp;
    neo.gold = this.gold;

    neo.keyYellow = this.keyYellow;
    neo.keyBlue = this.keyBlue;
    neo.keyRed = this.keyRed;

    return neo;
  }

  couldHandle(item?: Item): boolean {
    if (!item) {
      return true;
    }

    switch (item.type as ItemType) {
      case ItemType.DOOR: {
        switch (item.subtype as DoorKeySubtype) {
          case DoorKeySubtype.YELLOW: return this.keyYellow > 0;
          case DoorKeySubtype.BLUE: return this.keyBlue > 0;
          case DoorKeySubtype.RED: return this.keyRed > 0;
        }
        break;
      }

      case ItemType.ENEMY: {
        return this.couldFight(item as Enemy);
      }

      case ItemType.RED_GEM:
      case ItemType.BLUE_GEM:
      case ItemType.KEY:
      case ItemType.POTION:
        return true;
    }

    throw new Error("Unable to determine: " + JSON.stringify(item));
  }

  handle(item: Item): string {
    switch (item.type as ItemType) {
      case ItemType.DOOR: {
        switch (item.subtype as DoorKeySubtype) {
          case DoorKeySubtype.YELLOW:
            this.keyYellow--;
            return `使用黄钥匙，剩余${this.keyYellow}`;

          case DoorKeySubtype.BLUE:
            this.keyBlue--;
            return `使用蓝钥匙，剩余${this.keyBlue}`;

          case DoorKeySubtype.RED:
            this.keyRed--;
            return `适用红钥匙，剩余${this.keyRed}`;
        }
        break;
      }

      case ItemType.ENEMY: {
        const enemy = item as Enemy;
        this.fight(enemy);
        return `战胜${enemy.name}，HP：${this.hp} EXP：${this.exp} LEVEL: ${this.level} GOLD: ${this.gold}`;
      }

      case ItemType.RED_GEM: {
        const increment = Number(item.subtype) + 1;
        this.atk += increment;
        return `拾获红宝石, ATK：${this.atk}`;
      }

      case ItemType.BLUE_GEM: {
        const increment = Number(item.subtype) + 1;
        this.def += increment;
        return `拾获蓝宝石，DEF：${this.def}`;
      }

      case ItemType.KEY: {
        switch (item.subtype) {
          case DoorKeySubtype.YELLOW: {
            this.keyYellow++;
            return `拾获黄钥匙，现有${this.keyYellow}`;
          }

          case DoorKeySubtype.BLUE: {
            this.keyBlue++;
            return `拾获蓝钥匙，现有${this.keyBlue}`;
          }

          case DoorKeySubtype.RED: {
            this.keyRed;
            return `拾获红钥匙，现有${this.keyRed}`;
          }
        }
      }

      case ItemType.POTION: {
        const hp = getPotionEffect(item.subtype);
        this.hp += hp;
        return `喝下药水，HP：${this.hp}`;
      }
    }

    throw new Error("Unable to determine: " + JSON.stringify(item));
  }

  couldFight(enemy: Enemy): boolean {
    const dummy = this.clone();
    dummy.fight(enemy);
    return dummy.hp > 0;
  }

  fight(enemy: Enemy): void {
    enemy = Object.assign({}, enemy);

    // “我们未能击穿敌人的装甲”
    if (this.atk < enemy.def) {
      this.hp = 0;
      return;
    }

    let isFighting = true;
    let enemyHp = enemy.hp;

    // 玩家 战斗前技能
    if (isFighting) {
      // 暂无技能
      if (this.hp <= 0 || enemyHp <= 0) {
        isFighting = false;
      }
    }

    // 敌人 战斗前技能
    if (isFighting) {
      const {
        damageReceivedByA: actorDamage,
        damageReceivedByB: enemyDamage
      } = skillData.beforeBattle[enemy.skill.beforeBattle](this, enemy);
      this.hp -= actorDamage;
      enemyHp -= enemyDamage;

      if (this.hp <= 0 || enemyHp <= 0) {
        isFighting = false;
      }
    }

    // 正式战斗
    if (isFighting) {
      let actorIsAttacker = true; // 玩家总是先手

      while (isFighting) {
        const attacker: Fighter = actorIsAttacker ? this : enemy;
        const defender: Fighter = actorIsAttacker ? enemy : this;

        const expectedDamage = skillData.attack[attacker.skill.attack](attacker, defender);
        const { damage: actualDamage } = skillData.defense[defender.skill.defense](attacker, defender, expectedDamage);
        defender.hp -= actualDamage;

        if (defender.hp <= 0) {
          isFighting = false;
        }

        actorIsAttacker = !actorIsAttacker; // 更换攻守双方
      }
    }

    // 敌人 战斗后技能
    // 暂无技能

    // 玩家 战斗后技能
    // 暂无技能

    // 战斗结算
    if (this.hp > 0) {
      this.exp += enemy.exp;
      if (this.exp >= cumulativeExpRequiredForLevelUp[this.level + 1]) {
        this.level++;
        this.levelUp();
      }
      this.gold += enemy.gold;
    }
  }

  levelUp() {
    this.hp += this.level * 200 + Math.floor((this.hp * 20) / 100);
    this.atk += Number(this.level) + Math.floor((this.atk * 10) / 100);
    this.def += Number(this.level) + Math.floor((this.def * 10) / 100);
  }
}
