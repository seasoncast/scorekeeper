import ISportEvent from '../types/ISportEvent';
import IStats from '../types/IStats';
import ITimelineEvent from '../types/ITimelineEvent';
import Team from './Team';
import { CollaborationClient } from '@collab/client';

class SportEvent {
  public sport_data: ISportEvent;
  public team_max?: number;
  public team_min?: number;
  public callback_change?: (sport_data: ISportEvent) => void;
  private collabClient?: CollaborationClient;

  public constructor({
    scheduled_date,
    sport_type,
    collabClient,
  }: {
    scheduled_date: Date;
    sport_type: string;
    collabClient?: CollaborationClient;
  });
  public constructor({ id, collabClient }: { id: string; collabClient?: CollaborationClient });
  constructor(args: any) {
    this.collabClient = args.collabClient;
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
    const timeline_event = changer_callback(current_stats);
    
    // Update local state
    this.sport_data.stats = current_stats;
    
    // If using collaboration, send the update
    if (this.collabClient) {
      const diff = this.collabClient.compare(this.sport_data.stats, current_stats);
      this.collabClient.pushTimeline(diff, {
        ...timeline_event,
        type: 'stats_update'
      });
    }
    
    this.callback_change?.(this.sport_data);
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
