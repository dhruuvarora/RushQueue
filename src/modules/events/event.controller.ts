import { Request, Response } from "express";
import EventService from "./event.service";

export class EventController {
    async getAllEvents(req: Request, res: Response) {
        try {
            const getEvents = await EventService.getAllEvents();
            return res.status(200).json({
                success: true,
                data: getEvents,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error,
            });
        }
    }

    async getEventById(req:Request, res: Response){
        try {
            const eventId = req.params.id;
            const event = await EventService.getEventById(Number(eventId));
            if(!event){
                return res.status(404).json({
                    success: false,
                    message: "Event not found",
                });
            }
            return  res.status(200).json({
                success: true,
                data: event,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error,
            });
        }
    }
}

export default new EventController();