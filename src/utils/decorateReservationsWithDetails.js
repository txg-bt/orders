const axios = require("axios");
const RESTAURANTS_SERVICE = require("../../constants").RESTAURANTS_SERVICE;
const { logger } = require("./logger");

async function decorateReservationsWithDetails(reservations) {
  try {
    const userIds = reservations.map((reservation) => reservation.owner_id);

    const result = await axios.post(`${RESTAURANTS_SERVICE}/restaurants/bulk`, {
      user_ids: userIds,
    });

    const restaurants = result.data;

    logger({
      route: "/utils/decorateReservationsWithDetails",
      statusCode: 200,
      message: "reservations decorated successfully",
    });

    return reservations.map((reservation) => ({
      ...reservation,
      userDetails: restaurants.find(
        (restaurant) => restaurant.owner_id === reservation.user_id
      ),
    }));
  } catch (err) {
    console.log(err.message);

    logger({
      route: "/utils/decorateReservationsWithDetails",
      statusCode: 500,
      message: err.message,
    });
  }

  return reservations;
}

module.exports = decorateReservationsWithDetails;
