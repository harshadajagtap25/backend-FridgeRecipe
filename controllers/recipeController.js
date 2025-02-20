const Recipe = require("../models/Recipe");

// Add a new recipes in a array format
// baseurl/api/recipes/add
// payload-- >
//   [
//     {
//       name: "Spaghetti Carbonara",
//       ingredients: [
//         "Spaghetti",
//
//       ],
//       steps: [
//         "Boil pasta",
//        ...
//       ],
//       cookTime: 20,
//       servings: 2,
//       category: "Dinner",
//     },

//   ];
exports.addRecipesInArray = async (req, res) => {
  try {
    const recipes = req.body; // array of recipes
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return res
        .status(400)
        .json({ error: "Please provide a valid array of recipes" });
    }

    const addedRecipes = await Recipe.insertMany(recipes);
    res
      .status(201)
      .json({ message: "Recipes added successfully!", data: addedRecipes });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// Search recipes by name
// baseurl//pi/search?query=[recipe name]
exports.searchRecipes = async (req, res) => {
  const query = req.query.query.toLowerCase();
  try {
    const recipes = await Recipe.find({
      name: { $regex: query, $options: "i" },
    });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all recipes
exports.getAllRecipes = async (req, res) => {
  console.log("get all recipe called");
  try {
    const recipes = await Recipe.find();
    res.json({ data: recipes });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// Get full recipe details
// baseurl/api/recipes/[id]
exports.getRecipeById = async (req, res) => {
  const { id } = req.params;
  try {
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ msg: "Recipe not found" });
    }
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
