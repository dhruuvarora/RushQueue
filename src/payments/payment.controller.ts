import { Request, Response } from "express";
import { stripe } from "../lib/stripe";
import { db } from "../db";
import { redisConnect } from "../lib/redis";

const redis = redisConnect();
export class PaymentController {
  async initiatePayment(req: Request, res: Response) {
    try {
      const body = req.body as any;

      const eventSeatId = Number(body.eventSeatId);

      if (!eventSeatId) {
        return res.status(400).json({
          success: false,
          message: "eventSeatId is required",
        });
      }

      // 1. Check seat exists
      const seat = await db
        .selectFrom("Event_Seats")
        .selectAll()
        .where("event_seat_id", "=", eventSeatId)
        .executeTakeFirst();

      if (!seat) {
        return res.status(404).json({
          success: false,
          message: "Seat not found",
        });
      }

      // DEBUG
      console.log("DEBUG SEAT LOCK:", {
        seat_locked_user_id: seat.locked_user_id,
        seatStatus: seat.status,
        seatLockExpire: seat.lock_expire,
      });

      if (!seat.locked_user_id) {
        return res.status(400).json({
          success: false,
          message: "Seat is not locked by any user",
        });
      }

      if (new Date(seat.lock_expire!) < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Seat lock expired",
        });
      }

      // 4. Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: `Seat Booking #${eventSeatId}`,
              },
              unit_amount: 50000, // 500 INR
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.BASE_URL}/api/v1/payments/success?session_id={CHECKOUT_SESSION_ID}&eventSeatId=${eventSeatId}`,
        cancel_url: `${process.env.BASE_URL}/api/v1/payments/cancel?eventSeatId=${eventSeatId}`,
      });

      console.log(
        "SUCCESS URL =>",
        `${process.env.BASE_URL}/api/v1/payments/success`
      );
      console.log(
        "CANCEL URL =>",
        `${process.env.BASE_URL}/api/v1/payments/cancel`
      );

      return res.status(200).json({
        success: true,
        url: session.url,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error,
      });
    }
  }

  async paymentSuccess(req: Request, res: Response) {
    try {
      const session_id = req.query.session_id as string;
      const eventSeatId = Number(req.query.eventSeatId);

      console.log("SESSION ID RECEIVED:", session_id);

      if (!session_id) {
        return res.status(400).json({
          success: false,
          message: "Missing Stripe session_id",
        });
      }

      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status !== "paid") {
        return res.json({ success: false, message: "Payment not verified" });
      }

      await db
        .updateTable("Event_Seats")
        .set({
          status: "booked",
          locked_user_id: null,
          lock_expire: null,
        })
        .where("event_seat_id", "=", eventSeatId)
        .execute();

      await redis.del(`seat-lock:${eventSeatId}`);

      return res.json({
        success: true,
        message: "Payment successful and seat booked",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error,
      });
    }
  }

  async cancelPayment(req: Request, res: Response) {
    try {
      const { eventSeatId } = req.query;

      await db
        .updateTable("Event_Seats")
        .set({
          status: "available",
          locked_user_id: null,
          lock_expire: null,
        })
        .where("event_seat_id", "=", Number(eventSeatId))
        .execute();

      await redis.del(`seat-lock:${eventSeatId}`);

      return res.status(200).json({
        success: true,
        message: "Payment cancelled and seat released",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error,
      });
    }
  }
}

export default new PaymentController();
