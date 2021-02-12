import { Fighter } from "./Fighter";
import { Item } from "./Item";
import { ItemType } from "./ItemType";

export class Enemy extends Item implements Fighter {
  type = ItemType.ENEMY
  subtype!: number

  name!: string
  hp!: number
  atk!: number
  def!: number
  exp!: number
  gold!: number
  ability!: string
  skill!: {
    beforeBattle: string,
    attack: string
    defense: string
    afterBattle: string
  }
}
