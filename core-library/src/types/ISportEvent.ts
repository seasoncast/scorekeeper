import IStats from './IStats';
import ITimelineEvent from './ITimelineEvent';

export default interface ISportEvent {
  id: string;
  name?: string;

  stats: IStats;

  stats_inital: IStats;

  timeline: ITimelineEvent[];
}
