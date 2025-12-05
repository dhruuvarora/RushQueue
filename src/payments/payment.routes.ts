import { Router } from "express";
import paymentController from "./payment.controller";

const router = Router();

router.post("/initiate", paymentController.initiatePayment);

router.get("/success", paymentController.paymentSuccess);
router.get("/cancel", paymentController.cancelPayment);

export default router;
