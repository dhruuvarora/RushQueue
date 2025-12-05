import { Router } from "express";
import paymentController from "./payment.controller";

const router = Router();

router.post("/initiate", paymentController.initiatePayment);
router.get("/status/:paymentId", paymentController.paymentSuccess);
router.post("/cancel", paymentController.cancelPayment);

export default router;