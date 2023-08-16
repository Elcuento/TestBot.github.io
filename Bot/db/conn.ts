import mongoose from "mongoose";
import { db_conn_string } from "../config/config";

export const db_connection = async () => {
  if (db_conn_string) {
    await mongoose.connect(db_conn_string).catch((err) => {
      console.log(err);
    });
  }
};
