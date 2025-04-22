const express = require("express");
const router = express.Router();

const {
  addIngredientsInArray,
  getAllIngredients,
} = require("../controllers/ingredientsController");

router.post("/add", addIngredientsInArray);
router.get("/getList", getAllIngredients);

module.exports = router;
