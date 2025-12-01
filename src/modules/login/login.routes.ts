import { Router } from "express";
import LoginController from "./login.controller";

const router = Router();

router.post("/login", LoginController.login);

export default router;
