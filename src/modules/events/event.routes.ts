import { Router } from "express";
import EventController from "./event.controller";

const router = Router();

router.get("/get-events", EventController.getAllEvents);
router.get("/get-events/:id", EventController.getEventById);
router.get("/get-events/:id/seats", EventController.getEventSeats);

export default router;