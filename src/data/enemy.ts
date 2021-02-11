import { Enemy } from "../type";

import { ItemType } from "./ItemType";

const enemyData = {
  绿色史莱姆: {
    name: "绿色史莱姆",
    hp: 14,
    atk: 4,
    def: 0,
    exp: 1,
    gold: 1,
    type: "史莱姆",
    ability: "无技能",
    skill: {
      beforeBattle: "",
      attack: "普通攻击",
      defense: "无防御",
      afterBattle: ""
    }
  },
  红色史莱姆: {
    name: "红色史莱姆",
    hp: 23,
    atk: 7,
    def: 0,
    exp: 1,
    gold: 1,
    type: "史莱姆",
    ability: "无技能",
    skill: {
      beforeBattle: "",
      attack: "普通攻击",
      defense: "无防御",
      afterBattle: ""
    }
  },
  小蝙蝠: {
    name: "小蝙蝠",
    hp: 43,
    atk: 10,
    def: 2,
    exp: 1,
    gold: 1,
    type: "蝙蝠",
    ability: "无技能",
    skill: {
      beforeBattle: "",
      attack: "普通攻击",
      defense: "无防御",
      afterBattle: ""
    }
  },
  骷髅: {
    name: "骷髅",
    hp: 80,
    atk: 15,
    def: 3,
    exp: 2,
    gold: 1,
    type: "骷髅",
    ability: "无技能",
    skill: {
      beforeBattle: "",
      attack: "普通攻击",
      defense: "无防御",
      afterBattle: ""
    }
  },
  见习法师: {
    name: "见习法师",
    hp: 35,
    atk: 20,
    def: 0,
    exp: 2,
    gold: 2,
    type: "法师",
    ability: "魔法攻击",
    skill: {
      beforeBattle: "",
      attack: "魔法攻击",
      defense: "无防御",
      afterBattle: ""
    }
  },
  兽人: {
    name: "兽人",
    hp: 200,
    atk: 15,
    def: 7,
    exp: 2,
    gold: 2,
    type: "兽人",
    ability: "无技能",
    skill: {
      beforeBattle: "",
      attack: "普通攻击",
      defense: "无防御",
      afterBattle: ""
    }
  },
  黑色史莱姆: {
    name: "黑色史莱姆",
    hp: 310,
    atk: 27,
    def: 0,
    exp: 1,
    gold: 2,
    type: "史莱姆",
    ability: "无技能",
    skill: {
      beforeBattle: "",
      attack: "普通攻击",
      defense: "无防御",
      afterBattle: ""
    }
  },
  大蝙蝠: {
    name: "大蝙蝠",
    hp: 242,
    atk: 15,
    def: 11,
    exp: 1,
    gold: 3,
    type: "蝙蝠",
    ability: "无技能",
    skill: {
      beforeBattle: "",
      attack: "普通攻击",
      defense: "无防御",
      afterBattle: ""
    }
  },
  骷髅战士: {
    name: "骷髅战士",
    hp: 520,
    atk: 45,
    def: 21,
    exp: 2,
    gold: 3,
    type: "骷髅",
    ability: "无技能",
    skill: {
      beforeBattle: "",
      attack: "普通攻击",
      defense: "无防御",
      afterBattle: ""
    }
  },
  兽人武士: {
    name: "兽人武士",
    hp: 750,
    atk: 58,
    def: 27,
    exp: 2,
    gold: 4,
    type: "兽人",
    ability: "无技能",
    skill: {
      beforeBattle: "",
      attack: "普通攻击",
      defense: "无防御",
      afterBattle: ""
    }
  },
  初级守卫: {
    name: "初级守卫",
    hp: 800,
    atk: 55,
    def: 35,
    exp: 5,
    gold: 5,
    type: "守卫",
    ability: "无技能",
    skill: {
      beforeBattle: "",
      attack: "普通攻击",
      defense: "无防御",
      afterBattle: ""
    }
  },
  中级守卫: {
    name: "中级守卫",
    hp: 2500,
    atk: 120,
    def: 90,
    exp: 5,
    gold: 20,
    type: "守卫",
    ability: "无技能",
    skill: {
      beforeBattle: "",
      attack: "普通攻击",
      defense: "无防御",
      afterBattle: ""
    }
  }
};

const enemies = Object.entries(enemyData);
const name2Enemy = new Map<string, Enemy>();
const subtype2Enemy = new Map<number, Enemy>();

for (let i = 0; i < enemies.length; ++i) {
  const [name, data] = enemies[i];
  const enemy = {
    type: ItemType.ENEMY,
    name,
    subtype: i,
    hp: data.hp,
    atk: data.atk,
    def: data.def,
    exp: data.exp,
    gold: data.gold,
    ability: data.ability,
    skill: data.skill
  };

  name2Enemy.set(name, enemy);
  subtype2Enemy.set(i, enemy);
}

export function getEnemyByName(name: string): Enemy {
  return name2Enemy.get(name) as Enemy;
}

export function getEnemyBySubtype(subtype: number): Enemy {
  return subtype2Enemy.get(subtype) as Enemy;
}

export function getSubtypeOfEnemy(name: string): number {
  return getEnemyByName(name).subtype;
}
