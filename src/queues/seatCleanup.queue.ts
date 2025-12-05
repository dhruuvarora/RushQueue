import { Queue } from "bullmq";
import { redisConnect } from "../lib/redis";

const redis = redisConnect();

export const seatCleanupQueue = new Queue("seat-cleanup-queue", {
  connection: redis,
});