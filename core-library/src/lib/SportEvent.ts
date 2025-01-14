import * as jsonpatch from 'fast-json-patch';
import ISportEvent from '../types/ISportEvent';
import IStats from '../types/IStats';
import ITimelineEvent from '../types/ITimelineEvent';
import Team from './Team';

class SportEvent {
  public sport_data: ISportEvent;
  public team_max?: number;
  public team_min?: number;
  public callback_change?: (sport_data: ISportEvent) => void;

  public constructor({
    scheduled_date,
    sport_type,
  }: {
    scheduled_date: Date;
    sport_type: string;
  });
  public constructor({ id }: { id: string });
  constructor(args: any) {
    this.sport_data = {
      id: args.id ? args.id : 'id_unknown',
      scheduled_date: args.scheduled_date ? args.scheduled_date : new Date(),
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
  public setCallbackChange(callback_change: (sport_data: ISportEvent) => void) {
    this.callback_change = callback_change;
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
    this.callback_change?.(this.sport_data);
  }

  // build stats to a index in the timeline by applying the diff from the start_data to the current_data
  public buildStatsToTimeline(timeline_index: number) {
    const current_stats = JSON.parse(
      JSON.stringify(this.sport_data.stats_inital)
    );

    for (let i = 0; i < timeline_index; i++) {
      const timeline_event = this.sport_data.timeline[i];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
  public getTeams(): Team[] {
    return this.sport_data.stats.team_data.map((team_data) => {
      return new Team(team_data['name'], team_data['id']);
    });
  }

  public getStats(): IStats {
    return this.sport_data.stats;
  }
}

export default SportEvent;
