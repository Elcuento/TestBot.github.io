import { Telegraf } from "telegraf";
import { admin_bot_token } from "../config/config";
import { adminBotActionHandlers } from "./actions";
import { getAdmins } from "../db/services";
import { checkQueueForUpdates } from "./helpers";

export const start_admin_bot = async () => {
  if (admin_bot_token) {
    const adminBot = new Telegraf(admin_bot_token);

    adminBotActionHandlers.forEach(({ command, handler }) => {
      adminBot.action(command, handler);
    });

    const admins = await getAdmins();

    if (admins) {
      let isStarted = false;
      setInterval(async () => {
        if (!isStarted) {
          isStarted = true;
          await checkQueueForUpdates(adminBot, admins);
          isStarted = false;
        }
      }, 15000);
    }

    adminBot.launch();
  }
};
