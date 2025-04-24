const express = require("express");
const serverless = require("serverless-http");

const recipeRoutes = require("./routes/recipeRoutes");
const fridgeRoutes = require("./routes/fridgeRoutes");
const authRoutes = require("./routes/auth");
const ingredientsRoutes = require("./routes/ingredientRoutes");
const { connection } = require("./config/db");

const PORT = process.env.PORT || 8080;

require("dotenv").config();

const cors = require("cors");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://fridge-recipe-app.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the fridge recipe app");
});

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

// connection.then(() => console.log("MongoDB connected")).catch(console.error);
// module.exports = serverless(app);
