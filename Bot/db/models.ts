import mongoose, { Schema } from "mongoose";
import { INews, ISchedule, IUser } from "./types";

const scheduleSchema = new Schema<ISchedule>({
  lastRun: Date,
  nextRun: Date,
});

const userSchema = new Schema<IUser>({
  username: String,
  tg_id: Number,
  rating: Number,
  isAdmin: Boolean,
  receivedNews: [{ type: Schema.Types.ObjectId, ref: "news" }],
});

const newsSchema = new Schema<INews>({
  text: String,
  mediaLink: [String],
  date: Date,
  isApproved: Boolean,
  fromUser: userSchema,
});

const scheduleModel = mongoose.model<ISchedule>("schedule", scheduleSchema);
const userModel = mongoose.model<IUser>("user", userSchema);
const newsModel = mongoose.model<INews>("news", newsSchema);

export { scheduleModel, userModel, newsModel };
