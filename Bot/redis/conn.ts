import RedisSMQ from "rsmq";

export const rsmq = new RedisSMQ({
  host: "127.0.0.1",
  port: 6379,
  ns: "rsmq",
});
