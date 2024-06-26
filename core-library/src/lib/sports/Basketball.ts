import { Player, Position, Team } from '../../types';
import Editor, { IAction } from '../Editor';

export default class Basketball extends Editor {
  actions: { [key: string]: IAction } = {
    SHOT_MISSED: {
      name: 'SHOT_MISSED',
      description: '2 point shot missed',
      args: [
        { id: 'teamShooting', type: 'Team' },
        { id: 'teamDefending', type: 'Team' },
        { id: 'position', type: 'Position', optional: true },
        { id: 'shooter', type: 'Player', optional: true },
        { id: 'was_blocked', type: 'boolean', optional: true },
        { id: 'blocked_by', type: 'Player', optional: true },
      ],
      result: [
        {
          requires_team: ['$teamShooting'],
          requires_player: ['$shooter', '$teamShooting'],
          change_type: 'PlayerAndTeam',
          player_id: '$shooter',
          team_id: '$teamShooting',
          data_change: {
            shot_attempts: 1,
            shot_2_attempts: 1,
            shot_position: {
              type: 'push',
              value: '$position',
              requires: ['$position'],
            },
          },
        },
      ],
    },
    SHOT_MADE: {
      name: 'SHOT_MADE',
      description: '2 point shot made',
      args: [
        { id: 'teamShooting', type: 'Team' },
        { id: 'teamDefending', type: 'Team' },
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
            shot_attempts: 1,
            shot_made: 1,
            shot_2_attempts: 1,
            shot_2_made: 1,
            points: 2,
            shot_position: {
              type: 'push',
              value: '$position',
              requires: ['$position'],
            },
          },
        },
      ],
    },
  };

  shotMissed(args: {
    teamShooting: Team;
    teamDefending: Team;
    position?: Position;
    shooter?: Player;
    was_blocked?: boolean;
    blocked_by?: Player;
  }) {
    this.sportEvent.updateStats((stats) => {
      return this.parseAction(stats, this.actions['SHOT_MISSED'], args);
    });
  }

  shotMade(args: {
    teamShooting: Team;
    teamDefending: Team;
    position?: Position;
    shooter?: Player;
  }) {
    this.sportEvent.updateStats((stats) => {
      return this.parseAction(stats, this.actions['SHOT_MADE'], args);
    });
  }
}
