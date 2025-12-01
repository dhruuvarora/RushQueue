import { Router } from "express";
import LoginController from "./login.controller";

const router = Router();

router.post("/login", (req, res) => LoginController.login(req, res));

export default router;
