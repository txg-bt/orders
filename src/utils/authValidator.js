const AUTH_URL = require("../../constants").AUTH_URL;
const axios = require("axios");

module.exports = async (req, res, next) => {
  try {
    const response = await axios.get(`${AUTH_URL}/auth`, {
      headers: {
        Authorization: req.header("Authorization"),
      },
    });

    req.user_id = response.data.user_id;

    return next();
  } catch (err) {
    logWritter(`Unauthorized request on route ${req.path}`);

    return res.status(401).send("Not authorized");
  }
};
