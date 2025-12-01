import { Router } from "express";
import SignupController from "./signup.controller";

const router = Router();

router.post("/signup", SignupController.signup);

export default router;
