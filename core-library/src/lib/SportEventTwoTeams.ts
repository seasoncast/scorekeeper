import SportEvent from './SportEvent';

export default class SportEventTwoTeams extends SportEvent {
  constructor(scheduled_date: Date, sport_type: string) {
    super({ scheduled_date, sport_type });
    this.team_max = 2;
    this.team_min = 2;
  }
  public override getDefaultEventTitle(): string {
    const team_one = this.getTeamAtIndex(0)?.name;
    const team_two = this.getTeamAtIndex(1)?.name;

    return `${team_one || 'TBD'} vs ${team_two || 'TBD'}`;
  }
}
