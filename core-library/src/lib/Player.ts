export default class Player {
  name: string;
  id: string;
  constructor(name: string, id?: string) {
    this.name = name;
    this.id = id ? id : 'player-' + Math.random().toString(36).substr(2, 9);
  }
}
