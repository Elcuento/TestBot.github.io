import { db_connection } from "./db/conn";
import { updateSchedule } from "./db/services";
import { checkQueue } from "./redis/services";
import { start_admin_bot } from "./telegram_bots/adminBot";
import { start_user_bot } from "./telegram_bots/userBot";

const start = async () => {
  console.log("server started");

  await db_connection();
  checkQueue();
  await updateSchedule();
  await start_user_bot();
  await start_admin_bot();
};

start();
