export default interface IStats {
  team_data: {
    [key: string]: any;
  }[];

  global_data: {
    [key: string]: any;
  };

  player_data: {
    [key: string]: any;
  }[];
}
