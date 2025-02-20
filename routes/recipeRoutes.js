const express = require("express");
const {
  searchRecipes,
  getRecipeById,
  addRecipesInArray,
  getAllRecipes,
} = require("../controllers/recipeController");
const router = express.Router();

router.post("/recipes/add", addRecipesInArray);
router.get("/search", searchRecipes);
router.get("/recipes/:id", getRecipeById);
router.get("/all", getAllRecipes);

module.exports = router;
