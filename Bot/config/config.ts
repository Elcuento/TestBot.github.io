import dotenv from "dotenv";
dotenv.config();

export const {
  USER_BOT_TOKEN: user_bot_token,
  ADMIN_BOT_TOKEN: admin_bot_token,
  DB_CONN_STRING: db_conn_string,
} = process.env;

if (!user_bot_token) throw new Error('"USERS_BOT_TOKEN" env var is required!');
if (!admin_bot_token) throw new Error('"ADMIN_BOT_TOKEN" env var is required!');
if (!db_conn_string) throw new Error('"DB_CONN_STRING" env var is required!');
