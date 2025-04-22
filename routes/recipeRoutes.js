const express = require("express");
const router = express.Router();

const {
  getAllRecipeNames,
  addRecipesInArray,
  searchRecipes,
  getAllRecipes,
  getRecipeSuggestions,
} = require("../controllers/recipeController");

router.get("/names", getAllRecipeNames);
router.post("/add", addRecipesInArray);
router.get("/search", searchRecipes);
router.get("/all", getAllRecipes);
router.get("/suggestion/:user_id", getRecipeSuggestions);

module.exports = router;
