import { INews } from "../db/types";

export const stringFormatter = (text: string): string => {
  return text
    .replace(/\_/g, "\\_")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\~/g, "\\~")
    .replace(/\`/g, "\\`")
    .replace(/\>/g, "\\>")
    .replace(/\#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/\-/g, "\\-")
    .replace(/\=/g, "\\=")
    .replace(/\|/g, "\\|")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\./g, "\\.")
    .replace(/\!/g, "\\!");
};

export const formatDate = (news: INews) => {
  return (
    stringFormatter(
      `${news.text}\n\n${new Date(news.date).toLocaleDateString("en-GB")}`
    ) + ` —  @${news.fromUser.username}`
  );
};

export const delay = async (time: number) => {
  await new Promise<void>((resolve) =>
    setTimeout(() => resolve(), time * 1000)
  );
};
