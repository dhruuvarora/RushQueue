import { Queue } from "bullmq";
import { redisConnect } from "../lib/redis";

const redis = redisConnect();

export const seatSelectionQueue = new Queue("seat-selection-queue", {
  connection: redis,
});
