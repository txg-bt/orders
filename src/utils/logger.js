const axios = require("axios");
const LOGGER_API_URL = require("../../constants").LOGGER_API_URL;

async function logger({ route, statusCode, message, userId }) {
  try {
    await axios.post(
      `${LOGGER_API_URL}/`,
      {
        route,
        statusCode,
        message,
        userId,
        appName: "restaurants-service",
        timestamp: new Date().getTime(),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.log(err);
  }
}

module.exports = { logger };
