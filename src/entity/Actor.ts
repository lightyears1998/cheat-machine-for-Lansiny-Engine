import { Enemy } from "./Enemy";

export class Actor {
  level = 0
  hp = 10
  atk = 0
  def = 0
  exp = 0
  gold = 0

  static create(data: Partial<Actor>) {
    return Object.assign(new Actor(), data);
  }

  couldFight(): boolean {
    return true;
  }

  fight(): Actor {
    return Actor.create({});
  }
}
