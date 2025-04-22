const express = require("express");
const recipeRoutes = require("./routes/recipeRoutes");
const fridgeRoutes = require("./routes/fridgeRoutes");
const authRoutes = require("./routes/auth");
const ingredientsRoutes = require("./routes/ingredientRoutes");
const { connection } = require("./config/db");

const cors = require("cors");

require("dotenv").config();
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the fridge recipe app");
});

app.use(cors());

app.use("/v1/auth", authRoutes);

app.use("/recipe", recipeRoutes);
app.use("/fridge", fridgeRoutes);
app.use("/ingredient", ingredientsRoutes);

app.listen(PORT, async (req, res) => {
  try {
    await connection;
    console.log(`Connected to ${PORT}`);
  } catch (err) {
    console.log(`Something went wrong to connect to ${PORT}`);
  }
});
