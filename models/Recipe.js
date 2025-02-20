const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ingredients: [{ type: String, required: true }],
  steps: [{ type: String, required: true }],
  cookTime: { type: Number, required: true }, // in minutes
  servings: { type: Number, required: true },
  category: {
    type: String,
    enum: ["Breakfast", "Lunch", "Dinner", "Snack"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Recipe = mongoose.model("Recipe", RecipeSchema);

module.exports = Recipe;
