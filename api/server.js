const express = require("express");
const serverless = require("serverless-http");

const recipeRoutes = require("../routes/recipeRoutes");
const fridgeRoutes = require("../routes/fridgeRoutes");
const authRoutes = require("../routes/auth");
const ingredientsRoutes = require("../routes/ingredientRoutes");
const { connection } = require("../config/db");

const PORT = process.env.PORT || 8080;

const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the fridge recipe app");
});

app.use("/v1/auth", authRoutes);

app.use("/recipe", recipeRoutes);
app.use("/fridge", fridgeRoutes);
app.use("/ingredient", ingredientsRoutes);

// app.listen(PORT, async (req, res) => {
//   try {
//     await connection;
//     console.log(`Connected to ${PORT}`);
//   } catch (err) {
//     console.log(`Something went wrong to connect to ${PORT}`);
//   }
// });

connection.then(() => console.log("MongoDB connected")).catch(console.error);
module.exports = serverless(app);
