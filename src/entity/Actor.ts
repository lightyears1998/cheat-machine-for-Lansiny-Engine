import { Enemy } from "./Enemy";

export class Actor {
  constructor(
    public level: number,
    public hp: number,
    public atk: number,
    public def: number
  ) {}

  fight(enemy: Enemy): boolean {
    console.log(enemy);
    return false;
  }
}
