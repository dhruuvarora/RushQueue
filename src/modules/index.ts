import { Router } from "express";
import signupRoutes from "./signup/signup.routes";
import loginRoutes from "./login/login.routes";
import eventRoutes from "./events/event.routes";
import { verifyToken } from "../middleware/jwt";
import paymentRoutes from "../payments/payment.routes";
import bookingRoutes from "./bookings/bookings.routes";

const router = Router();

router.use("/auth", signupRoutes);
router.use("/auth", loginRoutes);
router.use("/events", verifyToken, eventRoutes);
router.use("/payments", paymentRoutes);
router.use("/bookings", verifyToken, bookingRoutes);

export default router;
