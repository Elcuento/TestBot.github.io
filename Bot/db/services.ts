import { newsModel, scheduleModel, userModel } from "./models";
import { INews, IUser } from "./types";

export const findUser = async (chat_id: number) => {
  return await userModel
    .findOne({ tg_id: chat_id })
    .then(async (res) => {
      return res;
    })
    .catch((err) => {
      console.log(err);
    });
};

export const createUser = async (
  username: string,
  tg_id: number,
  rating: number,
  isAdmin: boolean,
  receivedNews: INews[]
) => {
  return await new userModel({
    username,
    tg_id,
    rating,
    isAdmin,
    receivedNews,
  }).save();
};

export const getAdmins = async () => {
  return await userModel.find({ isAdmin: true });
};

export const getWhitelistedUsers = async () => {
  return await userModel.find({ rating: { $gt: 0 } });
};

export const createNews = async (
  text: string,
  mediaLink: string[],
  user: IUser,
  isApproved: boolean
) => {
  const news = await new newsModel({
    text,
    mediaLink,
    date: new Date(),
    isApproved,
    fromUser: user,
  }).save();
  return news;
};

export const findNews = async (id: string) => {
  return await newsModel.findById(id);
};

export const findWhitelistedNews = async () => {
  const schedule = await scheduleModel.findOne();

  return await newsModel.find({
    isApproved: true,
    date: { $gt: schedule?.lastRun },
  });
};

export const updateNewsApproval = async (id: string, isApproved: boolean) => {
  try {
    const newsItem = await newsModel.findById(id);

    if (!newsItem) {
      console.log(`News item with ID ${id} not found`);
      return;
    }

    newsItem.isApproved = isApproved;
    newsItem.date = new Date();
    if (isApproved) {
      await userModel.findOneAndUpdate(
        { tg_id: newsItem.fromUser.tg_id },
        {
          $inc: { rating: 10 },
          $push: { receivedNews: newsItem._id.toString() },
        },
        { new: true }
      );
    }

    await newsItem.save();
  } catch (error) {
    console.error(error);
  }
};

export const filterNews = async (tg_id: number) => {
  const user = await userModel.findOne({ tg_id });

  const newsCount = await newsModel.countDocuments({
    _id: { $nin: user?.receivedNews },
    isApproved: true,
  });

  return newsCount;
};

export const buyNews = async (tg_id: number) => {
  const user = await userModel.findOne({ tg_id });

  if (!user) {
    throw new Error(`User with tg_id ${tg_id} not found`);
  }

  if (user.rating < 1) {
    return "У вас недостаточно баллов, попробуйте отправить новость, чтобы их заработать";
  }

  let news;
  let count = await newsModel.countDocuments({ isApproved: true });

  if (count === user.receivedNews.length) {
    return `Новости для вас отсутствуют, подождите, пока другие пользователи отправят актуальную информацию`;
  }

  do {
    const random = Math.floor(Math.random() * count);
    news = await newsModel.findOne({ isApproved: true }).skip(random);

    if (!news) {
      return "На данный момент новости отсутствуют";
    }
    //@ts-ignore
  } while (user.receivedNews.includes(news._id));

  const updatedUser = await userModel.findOneAndUpdate(
    { tg_id },
    //@ts-ignore
    { $push: { receivedNews: news._id }, $inc: { rating: -1 } },
    { new: true }
  );

  return news;
};

export const createSchedule = async () => {
  const lastRun = new Date();
  const nextRun = new Date(lastRun.getTime() + 60 * 5000);
  return await new scheduleModel({
    lastRun,
    nextRun,
  }).save();
};

export const checkSchedule = async () => {
  const schedule = await scheduleModel.findOne();
  if (!schedule) {
    createSchedule();
  }
  const currentDate = new Date();

  if (schedule) {
    const { nextRun } = schedule;
    return currentDate >= nextRun;
  }

  return null;
};

export const updateSchedule = async () => {
  const schedule = await scheduleModel.findOne();
  const currentDate = new Date();

  if (schedule && currentDate >= schedule.nextRun) {
    await scheduleModel.findOneAndUpdate(
      {},
      {
        lastRun: currentDate,
        nextRun: new Date(currentDate.getTime() + 60 * 5000),
      }
    );
  }
};
