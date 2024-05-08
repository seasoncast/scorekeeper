import IStats from '../../types/IStats';
import Editor from '../Editor';
interface IAction {
  action_id: string;
  description: string;
  args: any[];
  result: IResult[];
}
interface IResult {
  requires?: string[];

  requires_team?: string[];
  requires_player?: string[];
  change_type: string;
  player_id?: string;
  team_id?: string;
  data_change: IDataChange;
}
interface IDataChange {
  [key: string]: {
    type: string;
    value: any;
    requires?: string[];
  };
}

export default class Basketball extends Editor {
  actions: IAction[] = [
    {
      action_id: 'BASKETBALL_SHOT_MISSED',
      description: '2 points shot missed',
      args: [
        { id: 'teamShooting', type: 'Team' },
        { id: 'teamDefending', type: 'Team', optional: true },

        { id: 'position', type: 'Position', optional: true },
        { id: 'shooter', type: 'Player', optional: true },
      ],
      result: [
        {
          requires_team: ['$teamShooting'],
          requires_player: ['$shooter', '$teamShooting'],
          change_type: 'PlayerAndTeam',
          player_id: '$shooter',
          team_id: '$teamShooting',
          data_change: {
            shot_attempts: { type: 'increment', value: 1 },
            shot_misses: { type: 'increment', value: 1 },
            shot_position: {
              type: 'push',
              value: '$position',
              requires: ['$position'],
            },
          },
        },
      ],
    },
  ];

  parseAction(stats: IStats, action: IAction, passed_args: any) {
    //  passed args are an object with the keys being the id of the arg and the value being the value of the arg

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
        return {
          error: 'Missing required args',
          missing_requires_team,
          missing_requires_player,
        };
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

  shotMissed(args: {
    teamShooting: string;
    teamDefending: string;
    position?: [number, number];
    shooter?: string;
    was_blocked?: boolean;
    blocked_by?: string;
  }) {
    this.sportEvent.updateStats((stats) => {
      return this.parseAction(stats, this.actions[0], args);
    });
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
}
