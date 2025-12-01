import { Router } from "express";
import signupRoutes from "./signup/signup.routes";
import loginRoutes from "./login/login.routes";
import eventRoutes from "./events/event.routes";
import { verifyToken } from "../middleware/jwt";

const router = Router();

router.use("/auth", signupRoutes);
router.use("/auth", loginRoutes);
router.use("/events", verifyToken, eventRoutes);

export default router;
