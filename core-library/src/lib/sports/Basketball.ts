import Editor, { IAction } from '../Editor';

export default class Basketball extends Editor {
  actions: { [key: string]: IAction } = {
    BASKETBALL_SHOT_MISSED: {
      description: '2 point shot missed',
      args: [
        { id: 'teamShooting', type: 'Team' },
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
            shot_2_attempts: { type: 'increment', value: 1 },
            shot_position: {
              type: 'push',
              value: '$position',
              requires: ['$position'],
            },
          },
        },
      ],
    },
    BASKETBALL_SHOT_MADE: {
      description: '2 point shot made',
      args: [
        { id: 'teamShooting', type: 'Team' },
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
            shot_made: { type: 'increment', value: 1 },
            shot_2_attempts: { type: 'increment', value: 1 },
            shot_2_made: { type: 'increment', value: 1 },
            points: { type: 'increment', value: 2 },
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
    teamShooting: string;
    teamDefending: string;
    position?: [number, number];
    shooter?: string;
    was_blocked?: boolean;
    blocked_by?: string;
  }) {
    this.sportEvent.updateStats((stats) => {
      return this.parseAction(
        stats,
        this.actions['BASKETBALL_SHOT_MISSED'],
        args
      );
    });
  }
}
