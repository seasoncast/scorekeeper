import IStats from './IStats';
import ITimelineEvent from './ITimelineEvent';

export default interface ISportEvent {
  id: string;
  name?: string;
  scheduled_date?: Date;
  stats: IStats;
  // real_time_clock?: {
  //   secondary_clock_timeout_mode: 'bool?';
  //   game_clock_start: 'date?';
  //   game_clock_time_seconds: 'int?';
  //   game_clock_running: 'bool?';
  //   game_clock_quarter: 'int?';
  //   secondary_clock_start: 'date?';
  //   secondary_clock_time_seconds: 'int?';
  //   secondary_clock_running: 'bool?';
  //   game_down: 'int?';
  //   game_distance_is_goal: 'bool?';
  //   game_possession: 'int?';
  // };

  stats_inital: IStats;

  timeline: ITimelineEvent[];
}
