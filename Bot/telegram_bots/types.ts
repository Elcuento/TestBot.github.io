import { Scenes } from "telegraf";

export interface UserSceneSession extends Scenes.SceneSessionData {
  content: string;
}

export type UserContext = Scenes.SceneContext<UserSceneSession>;
