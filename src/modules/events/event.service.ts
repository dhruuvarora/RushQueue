import { db } from "../../db";

interface EventData {
    event_id: number;
    event_name: string,
    event_date: Date,
    hall_name: string,
}

export class EventService {
    async getAllEvents(): Promise<EventData[]> {
        const event = await db
            .selectFrom("Events")
            .innerJoin("Booking_Halls",
                "Events.hall_id",
                "Booking_Halls.hall_id"
            ).select([
                "Events.event_id",
                "Events.event_name",
                "Events.event_date",
                "Booking_Halls.hall_name",
            ])
            .execute();
        return event;
    }

    async getEventById(eventId: number):Promise<EventData | null> {
        const event = await db
            .selectFrom("Events")
            .innerJoin("Booking_Halls",
                "Events.hall_id",
                "Booking_Halls.hall_id"
            ).select([
                "Events.event_id",
                "Events.event_name",
                "Events.event_date",
                "Booking_Halls.hall_name",
            ])
            .where("Events.event_id", "=", eventId)
            .executeTakeFirst();
        return event || null;
    }
    async getEventSeats(eventId: number) {
        const seats = await db
            .selectFrom("Event_Seats")
            .innerJoin("Seats",
                "Event_Seats.seat_id",
                "Seats.seat_id"
            )
            .select([
                "Event_Seats.event_seat_id",
                "Seats.seat_number",
                "Seats.seat_row",
                "Event_Seats.status",
            ])
            .where("Event_Seats.event_id", "=", eventId)
            .execute();
        return seats;
    }
}

export default new EventService();