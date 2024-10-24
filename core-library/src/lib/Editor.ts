import IStats from '../types/IStats';
import SportEvent from './SportEvent';
import Team from './Team';

export interface IPromptOptions {
  type: 'text' | 'select';
  title: string;
  options?: { label: string; value: string }[];
}

export interface IPromptCallback {
  (options: IPromptOptions): Promise<string>;
}
export interface IActionArg {
  id: string;
  type: string;
  optional?: boolean;
  prompt?: {
    title: string;
    required?: boolean;
    options?: { label: string; value: string }[];
  };
}

export interface IAction {
  name: string;
  description: string;
  args: IActionArg[];
  result: IResult[];
}
export interface IResult {
  requires?: string[];

  requires_team?: string[];
  requires_player?: string[];
  change_type: string;
  player_id?: string;
  team_id?: string;
  data_change: IDataChange;
}
export interface IDataChange {
  [key: string]: {
    type: string;
    value: any;
    requires?: string[];
  };
}
export default class Editor {
  protected sportEvent: SportEvent;
  protected promptCallback?: IPromptCallback;

  constructor(sportEvent: SportEvent, promptCallback?: IPromptCallback) {
    this.sportEvent = sportEvent;
    this.promptCallback = promptCallback;
  }

  async parseAction(stats: IStats, action: IAction, passed_args: any): Promise<IStats> {
    // Handle prompts for missing arguments
    const args = { ...passed_args };
    
    for (const arg of action.args) {
      if (!args[arg.id] && arg.prompt && this.promptCallback) {
        if (arg.prompt.required || !arg.optional) {
          const promptType = arg.prompt.options ? 'select' : 'text';
          const response = await this.promptCallback({
            type: promptType,
            title: arg.prompt.title,
            options: arg.prompt.options
          });
          args[arg.id] = response;
        }
      }
    }

    // process the results on stats
    // return the stats
    // $ are used to reference the passed args

    for (const result of action.result) {
      const missing_requires_team = result.requires_team
        ? result.requires_team.filter(
            (require) => !passed_args[require.replace('$', '')]
          )
        : [];

      const missing_requires_player = result.requires_player
        ? result.requires_player.filter(
            (require) => !passed_args[require.replace('$', '')]
          )
        : [];

      const team_id = result.team_id
        ? passed_args[result.team_id.replace('$', '')]
        : null;

      if (
        missing_requires_team.length > 0 &&
        missing_requires_player.length > 0
      ) {
        throw new Error('MISSING_REQ');
      }

      const isTeamChange =
        (result.change_type === 'Team' ||
          result.change_type === 'PlayerAndTeam') &&
        missing_requires_team.length == 0;

      const isPlayerChange =
        (result.change_type === 'Player' ||
          result.change_type === 'PlayerAndTeam') &&
        missing_requires_player.length == 0;

      if (isTeamChange) {
        const teamObj = stats.team_data.find((team) => team['id'] === team_id);

        if (!teamObj) {
          stats.team_data.push({
            id: team_id,
            stats: {},
          });
        }
        const teamIndex = stats.team_data.findIndex(
          (team) => team['id'] === team_id
        );

        this.updateStatsObject(
          stats.team_data[teamIndex],
          result.data_change,
          passed_args
        );
      }

      if (isPlayerChange) {
        const player_id = result.player_id
          ? passed_args[result.player_id.replace('$', '')]
          : null;

        const playerObj = stats.player_data.find(
          (player) => player['id'] === player_id
        );

        if (!playerObj) {
          stats.player_data.push({
            id: player_id,
            stats: {},
          });
        }

        const playerIndex = stats.player_data.findIndex(
          (player) => player['id'] === player_id
        );

        this.updateStatsObject(
          stats.player_data[playerIndex],
          result.data_change,
          passed_args
        );
      }
    }

    return {
      description_en: action.description,
      time_ms: Date.now(),
      action_id: action.action_id,
    };
  }

  updateStatsObject(
    stats: { [key: string]: any },
    data_change: IDataChange,
    passed_args: any
  ) {
    for (const [key, value] of Object.entries(data_change)) {
      const parsedValue =
        typeof value.value === 'string' && value.value.startsWith('$')
          ? passed_args[value.value.replace('$', '')]
          : value.value;

      if (parsedValue == null) {
        continue;
      }

      if (value.type === 'increment') {
        if (!stats[key]) {
          stats[key] = 0;
        }

        stats[key] += parsedValue;
      }

      if (value.type === 'push') {
        if (!stats[key]) {
          stats[key] = [];
        }

        stats[key].push(parsedValue);
      }

      if (value.type === 'set') {
        stats[key] = parsedValue;
      }
    }
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
        action_id: 'local-1',
      };
    });
  }
}
