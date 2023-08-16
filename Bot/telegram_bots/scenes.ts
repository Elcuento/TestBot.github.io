import { Markup, Scenes } from "telegraf";
import { UserContext } from "./types";
import { botText } from "./text";
import { filterNews, findUser } from "../db/services";
import { userBotHears } from "./hears";

export const successfulSendNewsScene = new Scenes.BaseScene<UserContext>(
  "successful_send_news_scene"
);
successfulSendNewsScene.enter(async (ctx) => {
  await ctx.reply(
    botText.successfulSendNewsText,
    Markup.keyboard([
      [Markup.button.text("Купить новость"), Markup.button.text("Баланс")],
    ]).resize()
  );
});
userBotHears.forEach(({ command, handler }) => {
  successfulSendNewsScene.hears(command, handler);
});

export const viewRatingScene = new Scenes.BaseScene<UserContext>(
  "view_rating_scene"
);
viewRatingScene.enter(async (ctx) => {
  if (ctx.chat && ctx.chat.id) {
    const user = await findUser(ctx.chat.id);
    const newsCount = await filterNews(ctx.chat.id);

    if (user) {
      await ctx.sendMessage(
        `Ваш рейтинг: *${user.rating}*\n\nКоличество доступных новостей: *${newsCount}*\n\n${botText.viewRatingText}`,
        {
          ...Markup.keyboard([
            [
              Markup.button.text("Купить новость"),
              Markup.button.text("Баланс"),
            ],
          ]).resize(),
          parse_mode: "MarkdownV2",
        }
      );
    } else {
      await ctx.sendMessage(botText.userDoesntExistText, {
        ...Markup.keyboard([
          [Markup.button.text("Купить новость"), Markup.button.text("Баланс")],
        ]).resize(),
        parse_mode: "MarkdownV2",
      });
    }
  }
});
userBotHears.forEach(({ command, handler }) => {
  viewRatingScene.hears(command, handler);
});
