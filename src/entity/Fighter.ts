export interface Fighter {
  hp: number
  atk: number
  def: number

  skill: {
    beforeBattle: string,
    attack: string
    defense: string
    afterBattle: string
  }
}
