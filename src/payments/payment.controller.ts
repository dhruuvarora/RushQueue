import { Request, Response } from "express";
import { stripe } from "../lib/stripe";
import { db } from "../db";
import { redisConnect } from "../lib/redis";

const redis = redisConnect();
export class PaymentController {
  async initiatePayment(req: Request, res: Response) {
    try {
      const body = req.body as any;
      const user = (req as any).user;

      const eventSeatId = Number(body.eventSeatId);
      const userId = user?.user_id;

      if (!eventSeatId) {
        return res
          .status(400)
          .json({ success: false, message: "eventSeatId is required" });
      }

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      // 1. Check seat exists
      const seat = await db
        .selectFrom("Event_Seats")
        .selectAll()
        .where("event_seat_id", "=", eventSeatId)
        .executeTakeFirst();

      if (!seat) {
        return res
          .status(404)
          .json({ success: false, message: "Seat not found" });
      }

      // 2. Check seat is locked by same user
      if (seat.locked_user_id !== userId) {
        return res.status(400).json({
          success: false,
          message: "Seat not locked by this user",
        });
      }

      // 3. Check lock expiry
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
        success_url: `${process.env.BASE_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}&eventSeatId=${eventSeatId}`,
        cancel_url: `${process.env.BASE_URL}/payments/cancel?eventSeatId=${eventSeatId}`,
      });

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
      const { session_id, eventSeatId } = req.query;
      const session = await stripe.checkout.sessions.retrieve(
        String(session_id)
      );

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
        .where("event_seat_id", "=", Number(eventSeatId))
        .execute();

      await redis.del(`seat-lock:${eventSeatId}`);

      return res.status(200).json({
        success: true,
        message: "Payment successful and seat booked",
      });
    } catch (error) {
      res.status(500).json({
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
