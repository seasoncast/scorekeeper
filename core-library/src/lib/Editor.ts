import SportEvent from './SportEvent';
import Team from './Team';

export default class Editor {
  protected sportEvent: SportEvent;
  constructor(sportEvent: SportEvent) {
    this.sportEvent = sportEvent;
  }

  public addScore(team: Team, score: number) {
    this.sportEvent.updateStats((stats) => {
      const team_data = stats.team_data.find(
        (team_data) => team_data['id'] === team.id
      );
      if (!team_data) {
        throw new Error('Team not found');
      }
      team_data['score'] += score;
      return {
        type: 'score',
        team_id: team.id,

        description_en: `${team.name} scored ${score} points`,
        time_ms: Date.now(),
        local_id: 'local-1',
      };
    });
  }
}
