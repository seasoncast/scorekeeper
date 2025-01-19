import { CollaborationClient } from '@org/client-library';
import ISportEvent from '../types/ISportEvent';
import IStats from '../types/IStats';
import ITimelineEvent from '../types/ITimelineEvent';
import Team from './Team';

class SportEvent {
  public sport_data: ISportEvent;
  public team_max?: number;
  public team_min?: number;
  public callback_change?: (sport_data: ISportEvent) => void;
  private collabClient?: CollaborationClient;
  private roomId: string = 'default-room2';

  public constructor({
    scheduled_date,
    sport_type,
    roomId,
  }: {
    scheduled_date: Date;
    sport_type: string;
    roomId?: string;
  });
  public constructor({ id, roomId }: { id: string; roomId?: string });
  constructor(args: any) {
    this.roomId = args.roomId ? args.roomId : this.roomId;
    this.initializeCollabClient();
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

  private async initializeCollabClient() {
    try {
      this.collabClient = new CollaborationClient('ws://localhost:8787');
      // Set up update handler
      this.collabClient.onUpdate((newDocument) => {
        // Update stats properties individually to maintain reactivity
        Object.assign(this.sport_data.stats, newDocument.stats);
        console.log('Received update:', this.sport_data);
        this.callback_change?.(this.sport_data);
      });
      await this.collabClient.connect(this.roomId);
      console.log(`Connected to collaboration room: ${this.roomId}`);
    } catch (error) {
      console.error('Failed to initialize collaboration client:', error);
    }
  }

  public updateStats(changer_callback: (stats: IStats) => ITimelineEvent) {
    const current_stats = JSON.parse(JSON.stringify(this.sport_data.stats));
    const timeline_event = changer_callback(current_stats);

    // If collaboration client is initialized, send the update
    if (this.collabClient) {
      this.collabClient.sendEdit(this.sport_data, {
        ...timeline_event,
        type: 'stats_update',
      });
    } else {
      // Fallback to local update if no collab client
      this.sport_data.stats = current_stats;
      this.callback_change?.(this.sport_data);
    }
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
