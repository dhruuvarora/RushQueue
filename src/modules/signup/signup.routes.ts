import { Router } from "express";
import SignupController from "./signup.controller";

const router = Router();

router.post("/signup", (req, res) => SignupController.signup(req, res));

export default router;
