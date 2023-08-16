export interface ISchedule {
  lastRun: Date;
  nextRun: Date;
}

export interface IUser {
  username: string;
  tg_id: number;
  rating: number;
  isAdmin: boolean;
  receivedNews: INews[];
}

export interface INews {
  text: string;
  mediaLink: string[];
  date: Date;
  isApproved: boolean;
  fromUser: IUser;
}
