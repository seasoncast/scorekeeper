import Player from './Player';

class Team {
  id: string;
  name: string;
  roster: Player[] = [];
  constructor(name: string, id?: string) {
    this.name = name;
    // TODO: hookup to a DB

    this.id = id ? id : 'team-' + Math.random().toString(36).substr(2, 9);
  }

  addPlayer(player: Player) {
    this.roster.push(player);
  }
}

export default Team;
