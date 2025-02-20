const express = require("express");
const recipeRoutes = require("./routes/recipeRoutes");
const fridgeRoutes = require("./routes/fridgeRoutes");
const { connection } = require("./config");
const cors = require("cors");

require("dotenv").config();
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the fridge recipe app");
});

app.use(cors());

app.use("/api", recipeRoutes);
app.use("/fridge", fridgeRoutes);

app.listen(PORT, async (req, res) => {
  try {
    await connection;
    console.log(`Connected to ${PORT}`);
  } catch (err) {
    console.log(`Something went wrong to connect to ${PORT}`);
  }
});
