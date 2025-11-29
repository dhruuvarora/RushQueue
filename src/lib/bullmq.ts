import { Queue } from "bullmq";

const bullmqQueue = new Queue("RushQueue", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

export default bullmqQueue;
