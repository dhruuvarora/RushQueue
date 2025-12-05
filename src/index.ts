import express from "express";
import { httpLogger } from "./middleware/httpLogger";
import { redisConnect } from "./lib/redis";
import modulesRouter from "./modules";
import { seatCleanupQueue } from "./queues/seatCleanup.queue";

const app = express();
app.use(express.json());
app.use(httpLogger);

const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.send("RushQueue Server is running");
});

app.use("/api/v1", modulesRouter);

const redis = redisConnect();
httpLogger.bind("Redis client initialized");

seatCleanupQueue.add("cleanup-expired-seats",
  {},
  {
    repeat: { every: 10000 } // 10 seconds
  });

console.log("Seat cleanup worker started, running every 10 seconds");

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
