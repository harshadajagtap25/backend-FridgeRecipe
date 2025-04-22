require("dotenv").config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || "fridgeRecipe",
  jwtExpiration: "1h",
};
