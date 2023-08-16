import { Scenes, Telegraf, session } from "telegraf";
import { user_bot_token } from "../config/config";
import { successfulSendNewsScene, viewRatingScene } from "./scenes";
import { UserContext } from "./types";
//@ts-ignore
import mediaGroup from "telegraf-media-group";
import { botText } from "./text";
import { createNews, createUser, findUser } from "../db/services";
import { userBotHears } from "./hears";
import { message } from "telegraf/filters";
import { enqueueNews } from "../redis/services";

export const start_user_bot = async () => {
  if (user_bot_token) {
    const stage = new Scenes.Stage([successfulSendNewsScene, viewRatingScene]);

    const userBot = new Telegraf<UserContext>(user_bot_token);
    userBot.use(mediaGroup());
    userBot.use(session());
    userBot.use(stage.middleware());
    userBot.use((ctx, next) => {
      ctx.scene.session.content ??= "";
      return next();
    });

    userBotHears.forEach(({ command, handler }) => {
      userBot.hears(command, handler);
    });
    userBot.on(message("text"), async (ctx) => {
      const user =
        (await findUser(ctx.message.chat.id)) ||
        (await createUser(
          ctx.message.from.username || "",
          ctx.message.chat.id,
          0,
          false,
          []
        ));

      const news = await createNews(ctx.message.text, [""], user, false);
      enqueueNews(news);

      await ctx.scene.enter("successful_send_news_scene");
    });
    //@ts-ignore
    userBot.on("media_group", async (ctx) => {
      const user =
        //@ts-ignore
        (await findUser(ctx.message.chat.id)) ||
        (await createUser(
          //@ts-ignore
          ctx.message.from.username || "",
          //@ts-ignore
          ctx.message.chat.id,
          0,
          false,
          []
        ));

      let caption;
      let isFirstMessage = true;
      const links: string[] = [];
      //@ts-ignore
      for (const message of ctx.mediaGroup) {
        if (isFirstMessage) {
          caption = message.caption === undefined ? "" : message.caption;
          isFirstMessage = false;
        }
        let href;
        if ("photo" in message) {
          ({ href } = await ctx.telegram.getFileLink(
            message.photo[message.photo.length - 1].file_id
          ));

          links.push(href);
        }
        if ("video" in message) {
          if (message.video.file_size && message.video.file_size > 50000000) {
            const reply = await ctx.replyWithMarkdownV2(
              botText.invalidVideoFileSizeText
            );

            setTimeout(() => {
              ctx.deleteMessage();
              ctx.deleteMessage(reply.message_id);
            }, 5000);
          }

          const { href } = await ctx.telegram.getFileLink(
            message.video.file_id
          );
          const thumb = await ctx.telegram.getFileLink(
            message.video.thumb?.file_id!
          );

          links.push(`${href} || ${thumb.href}`);
        }
      }

      if (links.length !== 0) {
        const news = await createNews(caption, links, user, false);
        enqueueNews(news);

        await ctx.scene.enter("successful_send_news_scene");
      }
    });
    userBot.on(message("animation"), async (ctx) => {
      const user =
        (await findUser(ctx.message.chat.id)) ||
        (await createUser(
          ctx.message.from.username || "",
          ctx.message.chat.id,
          0,
          false,
          []
        ));

      if (
        ctx.message.animation.file_size &&
        ctx.message.animation.file_size > 50000000
      ) {
        const reply = await ctx.replyWithMarkdownV2(
          botText.invalidVideoFileSizeText
        );

        setTimeout(() => {
          ctx.deleteMessage();
          ctx.deleteMessage(reply.message_id);
        }, 5000);
      }

      const { href } = await ctx.telegram.getFileLink(
        ctx.message.animation.file_id
      );
      const caption = ctx.message.caption ? ctx.message.caption : "";

      const news = await createNews(caption, [`${href}`], user, false);
      enqueueNews(news);

      await ctx.scene.enter("successful_send_news_scene");
    });
    userBot.on(message("video"), async (ctx) => {
      const user =
        (await findUser(ctx.message.chat.id)) ||
        (await createUser(
          ctx.message.from.username || "",
          ctx.message.chat.id,
          0,
          false,
          []
        ));

      if (
        ctx.message.video.file_size &&
        ctx.message.video.file_size > 50000000
      ) {
        const reply = await ctx.replyWithMarkdownV2(
          botText.invalidVideoFileSizeText
        );

        setTimeout(() => {
          ctx.deleteMessage();
          ctx.deleteMessage(reply.message_id);
        }, 5000);
      }

      const { href } = await ctx.telegram.getFileLink(
        ctx.message.video.file_id
      );
      const thumb = await ctx.telegram.getFileLink(
        ctx.message.video.thumb?.file_id!
      );
      const caption = ctx.message.caption ? ctx.message.caption : "";

      const news = await createNews(
        caption,
        [`${href} || ${thumb.href}`],
        user,
        false
      );
      enqueueNews(news);

      await ctx.scene.enter("successful_send_news_scene");
    });
    userBot.on(message("photo"), async (ctx) => {
      const user =
        (await findUser(ctx.message.chat.id)) ||
        (await createUser(
          ctx.message.from.username || "",
          ctx.message.chat.id,
          0,
          false,
          []
        ));

      const { href } = await ctx.telegram.getFileLink(
        ctx.message.photo[ctx.message.photo.length - 1].file_id
      );
      const caption = ctx.message.caption ? ctx.message.caption : "";

      const news = await createNews(caption, [href], user, false);
      enqueueNews(news);

      await ctx.scene.enter("successful_send_news_scene");
    });
    userBot.on("message", async (ctx) => {
      const reply = await ctx.replyWithMarkdownV2(botText.invalidSendNewsText);
    });

    userBot.launch();
  }
};
