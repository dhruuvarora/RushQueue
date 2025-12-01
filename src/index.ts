import express from "express";
import { httpLogger } from "./middleware/httpLogger";
import { redisConnect } from "./lib/redis";
import modulesRouter from "./modules";

const app = express();
app.use(express.json());
app.use(httpLogger);

const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.send("RushQueue Server is running");
});

app.use("/api", modulesRouter);

const redis = redisConnect();
httpLogger.bind("Redis client initialized");

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
