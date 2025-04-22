const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  ingredients: [
    {
      name: { type: String, required: true },
      isFridgeRequired: { type: Boolean, required: true, default: true },
      quantity: { type: String, required: true },
      unit: { type: String, required: true },
      isAvailable: { type: Boolean, default: false },
    },
  ],
  steps: [{ type: String, required: true }],
  cookTime: { type: Number, required: true }, // in minutes
  prepTime: { type: Number, required: true }, // in minutes
  servings: { type: Number, required: true },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium",
  },
  category: {
    type: String,
    enum: [
      "Breakfast",
      "Lunch",
      "Dinner",
      "Snack",
      "Dessert",
      "Beverage",
      "Main Course",
      "Side Dish",
    ],
    required: true,
  },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

const Recipe = mongoose.model("Recipe", RecipeSchema);

module.exports = Recipe;
