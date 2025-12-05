import { db } from "../../db";

export interface BookingData {
  user_id: number;
}

class bookingService {
  async getBookingsByUserId(userId: number) {
    const bookings = await db
      .selectFrom("Bookings")
      .innerJoin(
        "Event_Seats",
        "Event_Seats.event_seat_id",
        "Bookings.event_seat_id"
      )
      .innerJoin("Seats", "Seats.seat_id", "Event_Seats.seat_id")
      .innerJoin("Events", "Events.event_id", "Bookings.event_id")
      .innerJoin("Payments", "Payments.payment_id", "Bookings.payment_id")
      .select([
        "Bookings.booking_id",
        "Bookings.event_id",
        "Bookings.event_seat_id",

        "Events.event_name",
        "Events.event_date",

        "Seats.seat_number",
        "Seats.seat_row",

        "Payments.payment_amount",
        "Payments.payment_status",
        "Payments.transaction_id",
      ])
      .where("Bookings.user_id", "=", userId)
      .orderBy("Bookings.booking_id", "desc")
      .execute();

      return bookings;
  }
}

export default new bookingService();