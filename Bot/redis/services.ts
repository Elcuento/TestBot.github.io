import { INews } from "../db/types";
import { rsmq } from "./conn";

export const checkQueue = () => {
  rsmq.listQueues((err, queues) => {
    !queues.join(",").includes("news_queue") &&
      rsmq.createQueue({ qname: "news_queue" }, (err, res) => {
        err && console.error(err);
        res === 1 && console.log("queue created");
      });
  });
};

export const enqueueNews = (news: INews) => {
  rsmq
    .sendMessageAsync({ qname: "news_queue", message: JSON.stringify(news) })
    .catch((err) => console.error(err));
};

export const dequeueNews = async () => {
  return rsmq
    .popMessageAsync({ qname: "news_queue" })
    .then((res) => {
      if ("id" in res) {
        return JSON.parse(res.message);
      } else {
        console.log("queue is empty");
        return null;
      }
    })
    .catch((err) => {
      console.error(err);
      return null;
    });
};
