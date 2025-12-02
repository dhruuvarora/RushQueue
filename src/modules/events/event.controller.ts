import { Request, Response } from "express";
import EventService from "./event.service";
import { seatSelectionQueue } from "../../queues/seatSelection.queue";

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

  async getEventById(req: Request, res: Response) {
    try {
      const eventId = req.params.id;
      const event = await EventService.getEventById(Number(eventId));
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }
      return res.status(200).json({
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
  async getEventSeats(req: Request, res: Response) {
    try {
      const eventId = req.params.id;
      const seats = await EventService.getEventSeats(Number(eventId));
      if (!seats) {
        return res.status(404).json({
          success: false,
          message: "Seats not found for this event",
        });
      }
      return res.status(200).json({
        success: true,
        data: seats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error,
      });
    }
  }

  async selectSeats(req: Request, res: Response) {
    const eventId = Number(req.params.id);
    const { event_seat_id } = req.body;
    const userId = req.user?.user_id;

    try {
      if (!event_seat_id) {
        return res.status(400).json({
          success: false,
          message: "Event seat id is required",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // check event exists
      const event = await EventService.getEventById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      // check seat belong to this event
      const seat = await EventService.getSingleEventSeat(
        eventId,
        event_seat_id
      );
      if (!seat) {
        return res.status(404).json({
          success: false,
          message: "This seat does not belong to the given event",
        });
      }

      if (seat.status === "booked") {
        return res.status(400).json({
          success: false,
          message: "Seat is already booked",
        });
      }

      if (seat.status === "locked") {
        return res.status(400).json({
          success: false,
          message: "Seat is temporarily locked by another user",
        });
      }

      await seatSelectionQueue.add("lock-seat", {
        userId,
        eventId,
        eventSeatId: event_seat_id,
      });

      return res.status(202).json({
        success: true,
        message: "Seat selection request queued. Processing...",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : error,
      });
    }
  }
}

export default new EventController();
