import * as jsonpatch from 'fast-json-patch';
import ISportEvent from '../types/ISportEvent';
import IStats from '../types/IStats';
import ITimelineEvent from '../types/ITimelineEvent';
import Team from './Team';
class SportEvent {
  public sport_data: ISportEvent;
  public team_max?: number;
  public team_min?: number;

  constructor() {
    this.sport_data = {
      id: 'event-1',
      stats: {
        team_data: [],
        global_data: {},
        player_data: [],
      },
      stats_inital: {
        team_data: [],
        global_data: {},
        player_data: [],
      },

      timeline: [],
    };
  }

  public getEventTitle(): string {
    return this.sport_data.name || this.getDefaultEventTitle();
  }

  public getDefaultEventTitle(): string {
    return 'A Event';
  }
  public addTeam(team: Team): void {
    const team_data = {
      id: team.id,
      name: team.name,
      score: 0,
    };

    this.sport_data.stats.team_data.push(team_data);
    this.sport_data.stats_inital.team_data.push(team_data);
  }

  public updateStats(changer_callback: (stats: IStats) => ITimelineEvent) {
    const current_stats = JSON.parse(JSON.stringify(this.sport_data.stats));

    const timeline_inital = changer_callback(current_stats);

    const patches = jsonpatch.compare(this.sport_data.stats, current_stats);
    this.sport_data.stats = current_stats;

    this.sport_data.timeline.push({
      diff: patches,
      ...timeline_inital,
    });
  }

  // build stats to a index in the timeline by applying the diff from the start_data to the current_data
  public buildStatsToTimeline(timeline_index: number) {
    const current_stats = JSON.parse(
      JSON.stringify(this.sport_data.stats_inital)
    );

    for (let i = 0; i < timeline_index; i++) {
      const timeline_event = this.sport_data.timeline[i];
      jsonpatch.applyPatch(current_stats, timeline_event.diff);
    }

    console.log('current_stats', current_stats);
    return current_stats;
  }

  public undoLastTimelineEvent(): boolean {
    if (this.sport_data.timeline.length === 0) {
      return false;
    }
    const before_last_event = this.buildStatsToTimeline(
      this.sport_data.timeline.length - 1
    );
    this.sport_data.timeline.pop();
    this.sport_data.stats = before_last_event;
    return true;
  }

  public getTeamAtIndex(team_index: number): Team | null {
    const team_data = this.sport_data.stats.team_data[team_index];
    if (!team_data) {
      return null;
    }
    return new Team(team_data['name'], team_data['id']);
  }

  public getCurrentStats(): IStats {
    return this.sport_data.stats;
  }
}

export default SportEvent;
