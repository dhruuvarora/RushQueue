import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redisConnect = () =>{

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 5,
});

redis.on("connect", () => {
  console.log("Redis connected Successfully");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

return redis;
}