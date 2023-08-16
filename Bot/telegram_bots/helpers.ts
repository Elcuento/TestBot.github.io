import { Context, Markup, NarrowedContext, Telegraf } from "telegraf";
import { findWhitelistedNews, updateSchedule } from "../db/services";
import { UserContext } from "./types";
import { user_bot_token } from "../config/config";
import axios from "axios";
import {
  CallbackQuery,
  InputMediaPhoto,
  InputMediaVideo,
  Update,
} from "telegraf/typings/core/types/typegram";
import { dequeueNews } from "../redis/services";
import { INews, IUser } from "../db/types";
import { formatDate } from "../utils/utils";

export const checkQueueForUpdates = async (
  adminBot: Telegraf<Context<Update>>,
  admins: IUser[]
) => {
  let index = 0;
  while (true) {
    const news = await dequeueNews();
    if (!news) break;

    const admin = admins[index % admins.length];
    index += 1;

    let messageType;
    if (
      news.mediaLink.every(
        (link: string) =>
          link.search(/https:\/\/api.telegram.org\/file\//) !== -1
      ) &&
      news.mediaLink.length > 1
    ) {
      messageType = "media_group";

      let isFirst = true;
      let mediaGroup: (InputMediaPhoto | InputMediaVideo)[] = [];
      for (const link of news.mediaLink) {
        if (link.search(/photos/) !== -1) {
          const response = await axios.get(link, {
            responseType: "arraybuffer",
          });
          const imageBuffer: Buffer = await response.data;

          mediaGroup = [
            ...mediaGroup,
            {
              type: "photo",
              media: { source: imageBuffer },
              caption: isFirst ? formatDate(news) : "",
              parse_mode: "MarkdownV2",
            },
          ];
        } else {
          const match = link.match(/(.*) \|\| (.*)/);
          const [videoLink, thumbLink] = match!.slice(1);

          const videoResponse = await axios.get(videoLink, {
            responseType: "arraybuffer",
          });
          const videoBuffer: Buffer = await videoResponse.data;

          mediaGroup = [
            ...mediaGroup,
            {
              type: "video",
              media: { source: videoBuffer },
              caption: isFirst ? formatDate(news) : "",
              parse_mode: "MarkdownV2",
            },
          ];
        }

        if (isFirst) isFirst = !isFirst;
      }

      await adminBot.telegram.sendMediaGroup(admin.tg_id, mediaGroup);
      adminBot.telegram.sendMessage(admin.tg_id, "Your decision", {
        ...Markup.inlineKeyboard([
          Markup.button.callback(
            "Approve",
            `approve_${messageType}_${news._id}`
          ),
          Markup.button.callback(
            "Decline",
            `decline_${messageType}_${news._id}`
          ),
        ]),
      });
    } else if (
      news.mediaLink.length === 1 &&
      news.mediaLink.every(
        (link: string) =>
          link.search(/https:\/\/api.telegram.org\/file\//) !== -1
      )
    ) {
      if (news.mediaLink[0].search(/\/photos\//) !== -1) {
        messageType = "photo";

        const response = await axios.get(news.mediaLink[0], {
          responseType: "arraybuffer",
        });
        const imageBuffer: Buffer = await response.data;

        adminBot.telegram.sendPhoto(
          admin.tg_id,
          { source: imageBuffer },
          {
            ...Markup.inlineKeyboard([
              Markup.button.callback(
                "Approve",
                `approve_${messageType}_${news._id}`
              ),
              Markup.button.callback(
                "Decline",
                `decline_${messageType}_${news._id}`
              ),
            ]),
            caption: formatDate(news),
            parse_mode: "MarkdownV2",
          }
        );
      } else if (news.mediaLink[0].search(/\/videos\//) !== -1) {
        messageType = "video";

        const match = news.mediaLink[0].match(/(.*) \|\| (.*)/);
        const [videoLink, thumbLink] = match.slice(1);

        const videoResponse = await axios.get(videoLink, {
          responseType: "arraybuffer",
        });
        const videoBuffer: Buffer = await videoResponse.data;

        const thumbResponse = await axios.get(thumbLink, {
          responseType: "arraybuffer",
        });
        const thumbBuffer: Buffer = await thumbResponse.data;

        adminBot.telegram.sendVideo(
          admin.tg_id,
          { source: videoBuffer },
          {
            ...Markup.inlineKeyboard([
              Markup.button.callback(
                "Approve",
                `approve_${messageType}_${news._id}`
              ),
              Markup.button.callback(
                "Decline",
                `decline_${messageType}_${news._id}`
              ),
            ]),
            caption: formatDate(news),
            thumb: {
              source: thumbBuffer,
            },
            parse_mode: "MarkdownV2",
          }
        );
      } else if (news.mediaLink[0].search(/\/animations\//) !== -1) {
        messageType = "animation";

        const response = await axios.get(news.mediaLink[0], {
          responseType: "arraybuffer",
        });
        const imageBuffer: Buffer = await response.data;

        adminBot.telegram.sendAnimation(
          admin.tg_id,
          { source: imageBuffer },
          {
            ...Markup.inlineKeyboard([
              Markup.button.callback(
                "Approve",
                `approve_${messageType}_${news._id}`
              ),
              Markup.button.callback(
                "Decline",
                `decline_${messageType}_${news._id}`
              ),
            ]),
            caption: formatDate(news),
            parse_mode: "MarkdownV2",
          }
        );
      }
    } else {
      messageType = "message";
      adminBot.telegram.sendMessage(admin.tg_id, formatDate(news), {
        parse_mode: "MarkdownV2",
        ...Markup.inlineKeyboard([
          Markup.button.callback(
            "Approve",
            `approve_${messageType}_${news._id}`
          ),
          Markup.button.callback(
            "Decline",
            `decline_${messageType}_${news._id}`
          ),
        ]),
        disable_web_page_preview: true,
      });
    }
  }
};

export const moderateMediaGroup = async (
  ctx: NarrowedContext<
    Context<Update> & {
      match: RegExpExecArray;
    },
    Update.CallbackQueryUpdate<CallbackQuery>
  >,
  news: INews,
  isApproved: boolean
) => {
  if (
    ctx.update.callback_query.message &&
    "text" in ctx.update.callback_query.message
  ) {
    if (user_bot_token) {
      await ctx.editMessageText(
        `${isApproved ? "✅ Новость одобрена!" : "❌ Новость отклонена."}`
      );
      const userBot = new Telegraf(user_bot_token);

      if (news) {
        let isFirst = true;
        let mediaGroup: (InputMediaPhoto | InputMediaVideo)[] = [];
        for (const link of news.mediaLink) {
          if (link.search(/photos/) !== -1) {
            const response = await axios.get(link, {
              responseType: "arraybuffer",
            });
            const imageBuffer: Buffer = await response.data;

            mediaGroup = [
              ...mediaGroup,
              {
                type: "photo",
                media: { source: imageBuffer },
                caption: isFirst ? formatDate(news) : "",
                parse_mode: "MarkdownV2",
              },
            ];
          } else {
            const match = link.match(/(.*) \|\| (.*)/);
            const [videoLink, thumbLink] = match!.slice(1);

            const videoResponse = await axios.get(videoLink, {
              responseType: "arraybuffer",
            });
            const videoBuffer: Buffer = await videoResponse.data;

            mediaGroup = [
              ...mediaGroup,
              {
                type: "video",
                media: { source: videoBuffer },
                caption: isFirst ? formatDate(news) : "",
                parse_mode: "MarkdownV2",
              },
            ];
          }

          if (isFirst) isFirst = !isFirst;
        }

        await userBot.telegram.sendMediaGroup(news.fromUser.tg_id, mediaGroup);
        await userBot.telegram.sendMessage(
          news.fromUser.tg_id,
          `${
            isApproved
              ? "✅ Ваша новость была одобрена!"
              : "❌ Ваша новость была отклонена."
          }`
        );
      }
    }
  }
};

export const moderateText = async (
  ctx: NarrowedContext<
    Context<Update> & {
      match: RegExpExecArray;
    },
    Update.CallbackQueryUpdate<CallbackQuery>
  >,
  news: INews,
  isApproved: boolean
) => {
  if (
    ctx.update.callback_query.message &&
    "text" in ctx.update.callback_query.message
  ) {
    if (user_bot_token) {
      if (news) {
        const text = news.text;
        await ctx.editMessageText(
          `${formatDate(news)}\n\n${
            isApproved ? "✅ Новость одобрена\\!" : "❌ Новость отклонена\\."
          }`,
          {
            parse_mode: "MarkdownV2",
          }
        );
        const userBot = new Telegraf(user_bot_token);
        await userBot.telegram.sendMessage(
          news.fromUser.tg_id,
          `${text.replace(
            /^\d{2}\/\d{2}\/\d{4}\s—\s+@\w+\s*$|(\n\n)/gm,
            ""
          )}\n\n${
            isApproved
              ? "✅ Ваша новость была одобрена!"
              : "❌ Ваша новость была отклонена."
          }`
        );
      }
    }
  }
};

export const moderatePhoto = async (
  ctx: NarrowedContext<
    Context<Update> & {
      match: RegExpExecArray;
    },
    Update.CallbackQueryUpdate<CallbackQuery>
  >,
  news: INews,
  isApproved: boolean
) => {
  if (news)
    await ctx.editMessageCaption(
      `${formatDate(news)}\n\n${
        isApproved ? "✅ Новость одобрена\\!" : "❌ Новость отклонена\\."
      }`,
      {
        parse_mode: "MarkdownV2",
      }
    );
  if (user_bot_token) {
    const userBot = new Telegraf(user_bot_token);
    if (news && ctx.update.callback_query.message) {
      const response = await axios.get(news.mediaLink[0], {
        responseType: "arraybuffer",
      });
      const imageBuffer: Buffer = await response.data;
      userBot.telegram.sendPhoto(
        news.fromUser.tg_id,
        { source: imageBuffer },
        {
          caption: `${news.text.length !== 0 ? news.text : ""}\n\n${
            isApproved
              ? "✅ Ваша новость была одобрена!"
              : "❌ Ваша новость была отклонена."
          }`,
        }
      );
    }
  }
};

export const moderateVideo = async (
  ctx: NarrowedContext<
    Context<Update> & {
      match: RegExpExecArray;
    },
    Update.CallbackQueryUpdate<CallbackQuery>
  >,
  news: INews,
  isApproved: boolean
) => {
  if (news)
    await ctx.editMessageCaption(
      `${formatDate(news)}\n\n${
        isApproved ? "✅ Новость одобрена\\!" : "❌ Новость отклонена\\."
      }`,
      {
        parse_mode: "MarkdownV2",
      }
    );
  if (user_bot_token) {
    const userBot = new Telegraf(user_bot_token);
    if (news && ctx.update.callback_query.message) {
      const match = news.mediaLink[0].match(/(.*) \|\| (.*)/);
      const [videoLink, thumbLink] = match!.slice(1);

      const videoResponse = await axios.get(videoLink, {
        responseType: "arraybuffer",
      });
      const videoBuffer: Buffer = await videoResponse.data;

      const thumbResponse = await axios.get(thumbLink, {
        responseType: "arraybuffer",
      });
      const thumbBuffer: Buffer = await thumbResponse.data;

      userBot.telegram.sendVideo(
        news.fromUser.tg_id,
        { source: videoBuffer },
        {
          caption: `${news.text.length !== 0 ? news.text : ""}\n\n${
            isApproved
              ? "✅ Ваша новость была одобрена!"
              : "❌ Ваша новость была отклонена."
          }`,
          thumb: {
            source: thumbBuffer,
          },
        }
      );
    }
  }
};

export const moderateAnimation = async (
  ctx: NarrowedContext<
    Context<Update> & {
      match: RegExpExecArray;
    },
    Update.CallbackQueryUpdate<CallbackQuery>
  >,
  news: INews,
  isApproved: boolean
) => {
  if (news)
    await ctx.editMessageCaption(
      `${formatDate(news)}\n\n${
        isApproved ? "✅ Новость одобрена\\!" : "❌ Новость отклонена\\."
      }`,
      {
        parse_mode: "MarkdownV2",
      }
    );
  if (user_bot_token) {
    const userBot = new Telegraf(user_bot_token);
    if (news && ctx.update.callback_query.message) {
      const response = await axios.get(news.mediaLink[0], {
        responseType: "arraybuffer",
      });
      const imageBuffer: Buffer = await response.data;
      userBot.telegram.sendAnimation(
        news.fromUser.tg_id,
        { source: imageBuffer },
        {
          caption: `${news.text.length !== 0 ? news.text : ""}\n\n${
            isApproved
              ? "✅ Ваша новость была одобрена!"
              : "❌ Ваша новость была отклонена."
          }`,
        }
      );
    }
  }
};
