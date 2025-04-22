const Ingredient = require("../models/Ingredients");

// Add ingredients to array
const addIngredientsInArray = async (req, res) => {
  try {
    const { ingredients } = req.body;
    console.log("req body", req.body);

    if (
      !ingredients ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Valid ingredients array is required" });
    }

    const results = [];

    for (const ingredient of ingredients) {
      const { name, isFridgeRequired, category, commonUnits, defaultUnit } =
        ingredient;

      if (!name) {
        results.push({
          name,
          success: false,
          message: "Missing required fields",
        });
        continue;
      }

      const existingIngredient = await Ingredient.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });

      if (existingIngredient) {
        results.push({
          name,
          success: false,
          message: "Ingredient already exists",
        });
        continue;
      }

      const newIngredient = new Ingredient({
        name,
        isFridgeRequired:
          isFridgeRequired !== undefined ? isFridgeRequired : true,
        category,
        commonUnits: commonUnits || [],
        defaultUnit,
      });

      await newIngredient.save();

      results.push({
        name,
        success: true,
        ingredient: newIngredient,
      });
    }

    res.status(201).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all ingredients
const getAllIngredients = async (req, res) => {
  try {
    const { category } = req.query;

    let query = {};
    if (category) {
      query.category = category;
    }

    const ingredients = await Ingredient.find(query).sort({ name: 1 });
    res.status(200).json(ingredients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addIngredientsInArray,
  getAllIngredients,
};
