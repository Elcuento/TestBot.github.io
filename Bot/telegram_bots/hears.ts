import axios from "axios";
import { UserContext } from "./types";
import {
  CallbackQuery,
  InputMediaVideo,
  InputMediaPhoto,
  Update,
} from "telegraf/typings/core/types/typegram";
import { Context, NarrowedContext, Telegraf } from "telegraf";
import { INews } from "../db/types";
import { buyNews } from "../db/services";
import { user_bot_token } from "../config/config";

const sendNews = (ctx: UserContext) => {
  ctx.scene.enter("send_news_scene");
};

const viewRating = (ctx: UserContext) => {
  ctx.scene.enter("view_rating_scene");
};

const goBack = (ctx: UserContext) => {
  ctx.scene.enter("start_scene");
};

const buyNewsHandler = async (ctx: UserContext) => {
  const userBot = new Telegraf(user_bot_token || "");
  const tg_id = ctx.from?.id;
  const news: INews | string = await buyNews(tg_id || 0);

  if (typeof news === "string") {
    userBot.telegram.sendMessage(tg_id || "", news);
  }

  if (typeof news !== "string") {
    if (
      news.mediaLink.every(
        (link) => link.search(/https:\/\/api.telegram.org\/file\//) !== -1
      ) &&
      news.mediaLink.length === 1
    ) {
      if (news.mediaLink[0].search(/\/photos\//) !== -1) {
        const response = await axios.get(news.mediaLink[0], {
          responseType: "arraybuffer",
        });
        const imageBuffer: Buffer = await response.data;

        await userBot.telegram.sendPhoto(
          tg_id || "",
          {
            source: imageBuffer,
          },
          {
            caption: `${news.text}\n\n${news.date.toLocaleDateString()}`,
          }
        );
      } else if (news.mediaLink[0].search(/\/videos\//) !== -1) {
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

        await userBot.telegram.sendVideo(
          tg_id || "",
          {
            source: videoBuffer,
          },
          {
            thumb: {
              source: thumbBuffer,
            },
            caption: `${news.text}\n\n${news.date.toLocaleDateString()}`,
          }
        );
      } else if (news.mediaLink[0].search(/\/animations\//) !== -1) {
        const response = await axios.get(news.mediaLink[0], {
          responseType: "arraybuffer",
        });
        const imageBuffer: Buffer = await response.data;

        await userBot.telegram.sendAnimation(
          tg_id || "",
          {
            source: imageBuffer,
          },
          {
            caption: `${news.text}\n\n${news.date.toLocaleDateString()}`,
          }
        );
      }
    } else if (
      news.mediaLink.every(
        (link) => link.search(/https:\/\/api.telegram.org\/file\//) !== -1
      ) &&
      news.mediaLink.length > 1
    ) {
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
              caption: isFirst
                ? `${news.text}\n\n${news.date.toLocaleDateString()}`
                : "",
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
              caption: isFirst
                ? `${news.text}\n\n${news.date.toLocaleDateString()}`
                : "",
            },
          ];
        }

        if (isFirst) isFirst = !isFirst;
      }

      await userBot.telegram.sendMediaGroup(tg_id || "", mediaGroup);
    } else {
      await userBot.telegram.sendMessage(
        tg_id || "",
        `${news.text}\n\n${news.date.toLocaleDateString()}`
      );
    }
  }
};

export const userBotHears = [
  { command: "Послать новость", handler: sendNews },
  { command: "Баланс", handler: viewRating },
  { command: "Вернуться назад", handler: goBack },
  { command: "Купить новость", handler: buyNewsHandler },
];
