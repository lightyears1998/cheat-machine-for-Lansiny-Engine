import { Fighter } from "./Fighter";

/**
 * a 是发起者
 */
export type BeforeBattleSkillFunc<Ta extends Fighter = Fighter, Tb extends Fighter = Fighter> = (
  a: Ta, b: Tb
) => {
  a: Ta,
  b: Tb,
  damageReceivedByA: number,
  damageReceivedByB: number
}

/**
 * a 是攻击者
 */
export type AttackSkillFunc<Ta extends Fighter = Fighter, Tb extends Fighter = Fighter> = (a: Ta, b: Tb) => number

/**
 * a 是 攻击者， b是被攻击者, damage为a对b即将造成的伤害，处理后返回
 */
export type DefenseSkillFunc<Ta extends Fighter = Fighter, Tb extends Fighter = Fighter> = (
  a: Ta, b: Tb, damage: number
) => {
  a: Ta, b: Tb, damage: number
}

/**
 * a 是 发起者, damage必定是b受到的伤害
 */
export type AfterBattleSkillFunc<Ta extends Fighter = Fighter, Tb extends Fighter = Fighter> = (
  a: Ta, b: Tb
) => {
  a: Ta,
  b: Tb,
  damage: number
}

type SkillData = {
  beforeBattle: Record<string, BeforeBattleSkillFunc>
  attack: Record<string, AttackSkillFunc>
  defense: Record<string, DefenseSkillFunc>
  afterBattle: Record<string, AfterBattleSkillFunc>
}

export const skillData: SkillData = {
  beforeBattle: {
    "": function (a, b) {
      return {
        a,
        b,
        damageReceivedByA: 0,
        damageReceivedByB: 0
      };
    },
    小型魔法弹: function (a, b) {
      return {
        a,
        b,
        damageReceivedByA: 0,
        damageReceivedByB: a.atk
      };
    }
  },

  attack: {
    普通攻击: function (a, b) {
      const damage = a.atk - b.def <= 0 ? 0 : a.atk - b.def;
      return damage;
    },
    魔法攻击: function (a, b) {
      const damage = a.atk;
      return damage;
    }
  },

  defense: {
    无防御: function (a, b, damage) {
      return {
        a,
        b,
        damage
      };
    }
  },

  afterBattle: {
    "": function (a, b) {
      return {
        a,
        b,
        damage: 0
      };
    }
  }
};
