import IStats from '../../types/IStats';
import Editor, { IAction } from '../Editor';
export default class Volleyball extends Editor {
  config = {
    global: {
      VOLLEYBALL_TO_WIN_SET: {
        default: [25, 25, 15],
      },
    },
  };
  rules = [
    {
      change_type: 'Team',
      property: 'score',
      onChange: (stats: IStats) => {
        for (const team of stats.team_data) {
          if (team['match_point'] > 15) {
            return [
              {
                action_id: 'VOLLEYBALL_WON_SET',
                args: {
                  teamScoring: team['id'],
                },
              },
            ];
          }
        }
        return [];
      },
    },
  ];
  actions: { [key: string]: IAction } = {
    VOLLEYBALL_SCORED: {
      description: 'scored a point',
      args: [
        { id: 'teamScoring', type: 'Team' },
        { id: 'position', type: 'Position', optional: true },
        { id: 'shooter', type: 'Player', optional: true },
      ],
      result: [
        {
          requires_team: ['$teamScoring'],
          requires_player: ['$shooter', '$teamScoring'],
          change_type: 'PlayerAndTeam',
          player_id: '$shooter',
          team_id: '$teamScoring',
          data_change: {
            match_point: { type: 'increment', value: 1 },
          },
        },
      ],
    },
    VOLLEYBALL_WON_SET: {
      description: 'won set',
      args: [{ id: 'teamScoring', type: 'Team' }],
      result: [
        {
          requires_team: ['$teamScoring'],
          requires_player: ['$shooter', '$teamScoring'],
          change_type: 'PlayerAndTeam',
          player_id: '$shooter',
          team_id: '$teamScoring',
          data_change: {
            points: { type: 'increment', value: 1 },
          },
        },
        {
          requires_team: [],
          requires_player: [],
          change_type: 'AllTeams',
          data_change: {
            match_point: { type: 'set', value: 0 },
          },
        },
        {
          change_type: 'Global',
          player_id: '$shooter',
          team_id: '$teamScoring',
          data_change: {
            set: { type: 'increment', value: 1 },
          },
        },
      ],
    },
  };
}
