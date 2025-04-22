const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isFridgeRequired: { type: Boolean, required: true, default: true },
  category: { type: String, required: true },
  commonUnits: [{ type: String }],
  defaultUnit: { type: String, required: false },
});

const Ingredients = mongoose.model("Ingredients", ingredientSchema);

module.exports = Ingredients;
