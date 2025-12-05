import {Router} from "express";
import BookingController from "./bookings.controller";

const router = Router();

router.get("/my-bookings", BookingController.getMyBooking);

export default router;