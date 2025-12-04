import { Worker } from "bullmq";
import { redisConnect } from "../lib/redis";
import { db } from "../db";

const redis = redisConnect();

const LOCK_TTL_SECONDS = 60; // lock TTL (seconds)
const SEAT_LOCK_KEY = (eventId: number, eventSeatId: number) =>
  `seat-lock:${eventId}:${eventSeatId}`;

const SEAT_CHANNEL = "SEAT_UPDATED";

export const seatSelectionWorker = new Worker(
  "seat-selection-queue",
  async (job) => {
    const { userId, eventId, eventSeatId } = job.data as {
      userId: number | string;
      eventId: number;
      eventSeatId: number;
    };

    const lockKey = SEAT_LOCK_KEY(eventId, eventSeatId);
    const lockValue = String(userId);

    console.log(
      `[worker] processing job ${job.id} -> user=${userId} event=${eventId} seat=${eventSeatId}`
    );

    // 1) Try to acquire Redis lock (NX EX)
    const setResult = await (redis as any).set(
      lockKey,
      lockValue,
      "NX",
      "EX",
      LOCK_TTL_SECONDS
    );

    if (setResult !== "OK") {
      // someone else already holds lock
      console.log(`[worker] lock-acquire-failed for ${lockKey}`);
      throw new Error("Seat is currently locked by another user");
    }

    // At this point we hold the redis lock for LOCK_TTL_SECONDS
    try {
      // 2) Read current seat row from DB to ensure it's available
      const seat = await db
        .selectFrom("Event_Seats")
        .selectAll()
        .where("event_seat_id", "=", eventSeatId)
        .executeTakeFirst();

      if (!seat) {
        // seat doesn't exist in DB -> cleanup lock and fail
        console.log(`[worker] seat-not-found ${eventSeatId}`);
        // safe delete only if lock value matches (we set it to userId)
        await redis.eval(
          // Lua: if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end
          "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
          1,
          lockKey,
          lockValue
        );
        throw new Error("Seat not found");
      }

      // 3) Validate seat status
      // If seat is already booked -> release lock and fail
      if (seat.status === "booked") {
        console.log(`[worker] seat-already-booked ${eventSeatId}`);
        await redis.eval(
          "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
          1,
          lockKey,
          lockValue
        );
        throw new Error("Seat already booked");
      }

      // If seat is locked by someone else in DB -> release lock and fail
      if (
        seat.status === "locked" &&
        String(seat.locked_user_id) !== lockValue
      ) {
        console.log(`[worker] seat-locked-by-other ${eventSeatId}`);
        await redis.eval(
          "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
          1,
          lockKey,
          lockValue
        );
        throw new Error("Seat temporarily locked by another user");
      }

      // 4) Perform conditional update: only update if status is available OR locked by same user
      const lockExpireDate = new Date(Date.now() + LOCK_TTL_SECONDS * 1000);

      const updateResult = await db
        .updateTable("Event_Seats")
        .set({
          status: "locked" as const,
          locked_user_id: typeof userId === "number" ? userId : Number(userId),
          lock_expire: lockExpireDate,
        })
        .where("event_seat_id", "=", eventSeatId)
        .where((eb) =>
          eb.or([
            eb("status", "=", "available"),
            eb.and([
              eb("status", "=", "locked"),
              eb(
                "locked_user_id",
                "=",
                typeof userId === "number" ? userId : Number(userId)
              ),
            ]),
          ])
        )
        .execute();

        console.log("[worker] updateResult", updateResult);

      // Note: Kysely's execute() doesn't always return affectedRows across adapters.
      // To be safe, re-read the seat and confirm it's locked by current user
      const seatAfter = await db
        .selectFrom("Event_Seats")
        .selectAll()
        .where("event_seat_id", "=", eventSeatId)
        .executeTakeFirst();

      if (
        !seatAfter ||
        seatAfter.status !== "locked" ||
        String(seatAfter.locked_user_id) !== lockValue
      ) {
        // update didn't apply (some race) -> release lock and fail
        console.log(`[worker] conditional-update-failed for ${eventSeatId}`);
        await redis.eval(
          "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
          1,
          lockKey,
          lockValue
        );
        throw new Error("Failed to lock seat (concurrency)");
      }

      // 5) Optionally update the cached seat-layout in Redis (fast-read)
      try {
        const payload = JSON.stringify({
          eventSeatId,
          eventId,
          status: "locked",
          locked_user_id: seatAfter.locked_user_id,
          lock_expire: seatAfter.lock_expire,
        });
        await redis.publish(SEAT_CHANNEL, payload);
      } catch (pubErr) {
        console.warn("[worker] publish failed", pubErr);
      }

      console.log(
        `[worker] seat locked successfully ${eventSeatId} by user ${userId}`
      );
      // IMPORTANT: do NOT delete the redis lock here — keep it until payment/timeout/cron clears it.
      // The Redis key will auto-expire after LOCK_TTL_SECONDS.
      // Payment success handler should explicitly delete the lock (if needed) after verifying it's the same user.

      return { success: true, eventSeatId, eventId, userId };
    } catch (err) {
      console.error("[worker] error processing job", err);
      throw err;
    }
  },
  { connection: redis }
);
