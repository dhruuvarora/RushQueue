import { Worker } from "bullmq";
import { redisConnect } from "../lib/redis";
import { db } from "../db";

const redis = redisConnect();

export const seatCleanupWorker = new Worker(
  "seat-cleanup-queue",
  async () => {
    console.log("[seat-cleanup-worker] processing job ");

    const expiredSeats = await db
      .selectFrom("Event_Seats")
      .selectAll()
      .where("status", "=", "locked")
      .where("lock_expire", "<", new Date())
      .execute();

    if (expiredSeats.length === 0) {
      console.log("No expired seats found");
      return;
    }

    for (const seat of expiredSeats) {
      console.log("Releasing expired seat:", seat.event_seat_id);

      // update in db
      await db
        .updateTable("Event_Seats")
        .set({
          status: "available",
          locked_user_id: null,
          lock_expire: null,
        })
        .where("event_seat_id", "=", seat.event_seat_id)
        .execute();

      // remove redis lock
      const redisKey = `seat-lock:${seat.event_id}:${seat.event_seat_id}`;
      await redis.del(redisKey);

      console.log("Seat released:", seat.event_seat_id);
    }
  },
  { connection: redis }
);
