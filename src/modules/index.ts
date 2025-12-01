import { Router } from "express";
import signupRoutes from "./signup/signup.routes";
import loginRoutes from "./login/login.routes";

const router = Router();

router.use("/auth", signupRoutes);
router.use("/auth", loginRoutes);

export default router;
