import { Context, NarrowedContext, Telegraf } from "telegraf";
import { buyNews, findNews, updateNewsApproval } from "../db/services";
import {
  CallbackQuery,
  InputMediaPhoto,
  InputMediaVideo,
  Update,
} from "telegraf/typings/core/types/typegram";
import {
  moderateAnimation,
  moderateMediaGroup,
  moderatePhoto,
  moderateText,
  moderateVideo,
} from "./helpers";
import axios from "axios";
import { INews } from "../db/types";

const moderateMessage = async (
  ctx: NarrowedContext<
    Context<Update> & {
      match: RegExpExecArray;
    },
    Update.CallbackQueryUpdate<CallbackQuery>
  >
) => {
  const action = ctx.match[1];
  const messageType = ctx.match[2];
  const newsId = ctx.match[3];

  const news = await findNews(newsId);

  if (news) {
    if (action === "approve") {
      await updateNewsApproval(newsId, true);
      if (messageType === "message") {
        await moderateText(ctx, news, true);
      }
      if (messageType === "photo") {
        await moderatePhoto(ctx, news, true);
      }
      if (messageType === "video") {
        await moderateVideo(ctx, news, true);
      }
      if (messageType === "animation") {
        await moderateAnimation(ctx, news, true);
      }
      if (messageType === "media_group") {
        await moderateMediaGroup(ctx, news, true);
      }
    } else if (action === "decline") {
      await updateNewsApproval(newsId, false);
      if (messageType === "message") {
        await moderateText(ctx, news, false);
      }
      if (messageType === "photo") {
        await moderatePhoto(ctx, news, false);
      }
      if (messageType === "video") {
        await moderateVideo(ctx, news, false);
      }
      if (messageType === "animation") {
        await moderateAnimation(ctx, news, false);
      }
      if (messageType === "media_group") {
        await moderateMediaGroup(ctx, news, false);
      }
    }
  }
};

export const adminBotActionHandlers = [
  {
    command:
      /(approve|decline)_(photo|video|animation|message|media_group)_([a-f\d]{24})/,
    handler: moderateMessage,
  },
];
