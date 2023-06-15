const router = require("express").Router();
const { pool } = require("../database/database");
const authorization = require("../utils/authValidator");
const { logger } = require("../utils/logger");

const logWritter = (data) => console.log(data);

const decorateReservationsWithDetails = require("../utils/decorateReservationsWithDetails");

router.get("/restaurant/:restaurantId", authorization, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.query;

    const computedQuery =
      status === "pending"
        ? [
            "SELECT * FROM reservations WHERE restaurant_id = $1 AND status = $2 ORDER BY reservation_date DESC;",
            [restaurantId, status],
          ]
        : [
            "SELECT * FROM reservations WHERE restaurant_id = $1 ORDER BY reservation_date;",
            [restaurantId],
          ];

    const reservations = await pool.query(...computedQuery);

    if (!reservations.rows.length) {
      logWritter("No reservations found");

      return res.status(404).send("No reservations found");
    }

    const decoratedReservations = await decorateReservationsWithDetails(
      reservations.rows
    );

    return res.status(200).json(decoratedReservations);
  } catch (err) {
    logWritter(err.message);

    return res.status(500).send("Server error");
  }
});

router.get("/user", authorization, async (req, res) => {
  try {
    const { user_id } = req;

    const reservations = await pool.query(
      "SELECT * FROM reservations WHERE user_id = $1 ORDER BY reservation_date DESC",
      [user_id]
    );

    if (!reservations.rows.length) {
      logWritter("No reservations found");

      return res.status(404).send("No reservations found");
    }

    const decoratedReservations = await decorateReservationsWithDetails(
      reservations.rows
    );

    logWritter("Got all reservations");

    return res.status(200).json(decoratedReservations);
  } catch (err) {
    logWritter(err.message);

    return res.status(500).send("Server error");
  }
});

router.post("/restaurant/:restaurantId", authorization, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { user_id } = req;
    const { reservation_date, num_guests } = req.body;
    const status = "pending";

    const date = new Date(reservation_date);

    const newReservation = await pool.query(
      "INSERT INTO reservations (user_id, restaurant_id, reservation_date, num_guests, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [user_id, restaurantId, date, num_guests, status]
    );

    logWritter("Created new reservation");
    res.status(201).json(newReservation.rows[0]);
  } catch (err) {
    logWritter(err.message);

    return res.status(500).send("Server error");
  }
});

router.put(
  "/restaurant/:restaurantId/:reservationId",
  authorization,
  async (req, res) => {
    try {
      const { restaurantId, reservationId } = req.params;
      const { status } = req.body;
      const { user_id } = req;

      if (!ownsRestaurant(restaurantId, user_id)) {
        logWritter("Not allowed to update reservation");

        return res.status(403).send("Not allowed to update reservation");
      }

      const updatedReservation = await pool.query(
        "UPDATE reservations SET status = $1 WHERE reservation_id = $2 RETURNING *",
        [status, reservationId]
      );

      logWritter("Updated reservation");

      return res.status(200).json(updatedReservation.rows[0]);
    } catch (err) {
      logWritter(err.message);

      return res.status(500).send("Server error");
    }
  }
);

// put reservation for user

router.put("/user/:reservationId", authorization, async (req, res) => {
  try {
    const { reservationId } = req.params;
    // update date or num_guests
    const { reservation_date, num_guests } = req.body;
    const { user_id } = req;

    const reservation = await pool.query(
      "SELECT * FROM reservations WHERE reservation_id = $1 AND user_id = $2",
      [reservationId, user_id]
    );

    if (!reservation.rows.length) {
      logWritter("No reservation found");

      return res.status(404).send("No reservation found");
    }

    // default values
    const date =
      new Date(reservation_date) || reservation.rows[0].reservation_date;
    const guests = num_guests || reservation.rows[0].num_guests;

    const updatedReservation = await pool.query(
      "UPDATE reservations SET reservation_date = $1, num_guests = $2 WHERE reservation_id = $3 RETURNING *",
      [date, guests, reservationId]
    );

    logWritter("Updated reservation");

    return res.status(200).json(updatedReservation.rows[0]);
  } catch (err) {
    logWritter(err.message);

    return res.status(500).send("Server error");
  }
});

// delete reservation for user

router.delete("/user/:reservationId", authorization, async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { user_id } = req;

    const reservation = await pool.query(
      "SELECT * FROM reservations WHERE reservation_id = $1 AND user_id = $2",
      [reservationId, user_id]
    );

    if (!reservation.rows.length) {
      logWritter("No reservation found");

      return res.status(404).send("No reservation found");
    }

    await pool.query("DELETE FROM reservations WHERE reservation_id = $1", [
      reservationId,
    ]);

    logWritter("Deleted reservation");

    return res.status(204).send("Reservation deleted");
  } catch (err) {
    logWritter(err.message);

    return res.status(500).send("Server error");
  }
});

module.exports = router;
