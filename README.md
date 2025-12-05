<img width="1024" height="1024" alt="RushQueue" src="https://github.com/user-attachments/assets/6873eec6-cf9b-4eb6-9291-95c351a0a1d1" />
# 🚀 RushQueue – High-Concurrency Concert Ticket Booking System

**RushQueue** is a production-grade backend system designed for handling **high-concurrency** concert ticket booking. It utilizes a robust architecture featuring distributed locking and queuing to ensure **atomic seat selection** and **prevent double-booking**, even under immense load.

---

## ✨ Features

* **High-Concurrency Safety:** Uses **BullMQ** for queue-based seat selection and **Redis Distributed Locks** (`SET ... NX EX`) to guarantee that only one user can attempt to lock a specific seat at a time.
* **Race Condition Prevention:** The queue system serializes seat selection attempts, eliminating race conditions at the application level.
* **Real-Time Consistency:** Seats are marked as `locked` in the database immediately upon successful Redis lock acquisition.
* **Automatic Lock Expiry (TTL):** Locked seats automatically expire after a set time (default: 60 seconds) using Redis Time-To-Live (TTL) and a dedicated cleanup worker.
* **Clean Payment Flow:** Integration with **Stripe Checkout** ensures the seat is only permanently marked as `booked` after a confirmed successful payment.
* **Secure Authentication:** User sign-up and subsequent requests are secured using **JWT (JSON Web Tokens)**.

---

## 🧠 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | Node.js + Express (TypeScript) | Fast, non-blocking core for API handling. |
| **Database** | MySQL (with Kysely Query Builder) | Persistent storage for users, events, and seat states. |
| **Queue System** | BullMQ (Queues + Workers) | Manages asynchronous, ordered processing of seat selection and cleanup jobs. |
| **Distributed Locking/Cache** | Redis (ioredis) | Used for high-speed, atomic distributed locks and Pub/Sub. |
| **Payments** | Stripe | Handles secure payment processing. |
| **Authentication** | JWT + bcryptjs | Secure token generation and password hashing. |

---

## 🏗 Architecture and System Flow

The system's core strength lies in its ability to safely transition a seat from `available` to `locked` and then to `booked`.

### Key Flow: Seat Locking

1.  **Client Request:** User selects a seat on the UI.
2.  **Controller:** The request is immediately pushed to the **BullMQ Seat Selection Queue**.
3.  **Worker ➡️ Redis Lock:** A worker consumes the job and attempts to acquire a lock using Redis: `SET seat-lock:eventId:seatId <userId> NX EX 60`.
4.  **Success:** If the lock succeeds, the worker updates the **`Event_Seats`** table (`status = 'locked'`) and sets a DB expiry time.
5.  **Failure (Contention):** If the lock is held by another user, the job fails, and the user is notified the seat is taken.



### Key Flow: Cleanup

* A dedicated **Seat Cleanup Worker** runs every **10 seconds**.
* It queries the `Event_Seats` table for all rows where the `status` is `'locked'` and the `lock_expire` time is in the past.
* It updates these seats to `status = 'available'` and deletes the corresponding Redis lock keys, preventing deadlocks.

---

## 🗄 Database Schema (Simplified)

| Table | Primary Purpose | Key Fields |
| :--- | :--- | :--- |
| **Users** | User credentials and profiles. | `user_id`, `user_email`, `user_password` (hashed) |
| **Events** | Event details and venue information. | `event_id`, `event_name`, `event_date` |
| **Event_Seats** | **Crucial:** Tracks real-time seat status. | `event_seat_id`, `event_id`, **`status`** (`available` / `locked` / `booked`), `locked_user_id`, `lock_expire` |
| **Bookings** | Final record of successful bookings. | `booking_id`, `event_seat_id`, `user_id`, `payment_id` |
| **Payments** | Stripe transaction records. | `payment_id`, `transaction_id`, `payment_status` |

---

## ⚙️ Installation and Setup

### Prerequisites

* Node.js (v18+)
* MySQL Database
* Redis Server

### Steps

1.  **Clone the Repository:**
    ```bash
    git clone <repo-url>
    cd RushQueue
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory and configure the necessary variables:

    ```env
    # Database
    DB_HOST=localhost
    DB_USER=root
    DB_PASS=password
    DB_NAME=rushqueue

    # Redis (for BullMQ and Locks)
    REDIS_HOST=localhost
    REDIS_PORT=6379

    # Security
    SALT_ROUNDS=10
    JWT_SECRET=mysecret

    # Payments
    STRIPE_SECRET_KEY=sk_test_xxx
    BASE_URL=http://localhost:3001
    ```

4.  **Run the Project:**

    RushQueue requires **three separate processes** to run: the Express server, the Seat Selection Worker, and the Cleanup Worker.

    | Process | Command | Description |
    | :--- | :--- | :--- |
    | **Express Server** | `npm run dev` | Handles API requests (signup, browsing, payment initiation). |
    | **Seat Selection Worker** | `npm run worker` | Processes jobs from the `seatSelectionQueue` (the core locking logic). |
    | **Cleanup Worker** | `npm run worker:cleanup` | Runs background checks to release expired seat locks. |
