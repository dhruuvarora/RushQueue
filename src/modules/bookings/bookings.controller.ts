import { Request, Response } from "express";
import bookingService from "./bookings.service";

export class BookingController {
  async getMyBooking(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const bookings = await bookingService.getBookingsByUserId(Number(userId));

      return res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err,
      });
    }
  }
}

export default new BookingController();
