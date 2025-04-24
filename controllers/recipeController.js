const Recipe = require("../models/Recipe");
const Fridge = require("../models/Fridge");

// Get all recipe names
const getAllRecipeNames = async (req, res) => {
  try {
    const recipes = await Recipe.find({}, "name");
    res
      .status(200)
      .json(recipes.map((recipe) => ({ id: recipe._id, name: recipe.name })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add recipes to array
const addRecipesInArray = async (req, res) => {
  try {
    const { recipes } = req.body;

    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
      return res
        .status(400)
        .json({ message: "Valid recipes array is required" });
    }

    const results = [];

    for (const recipeData of recipes) {
      const {
        name,
        imageUrl,
        ingredients,
        steps,
        cookTime,
        prepTime,
        servings,
        category,
        difficulty,
        tags,
      } = recipeData;

      // Validate required fields
      if (
        !name ||
        !imageUrl ||
        !ingredients ||
        !steps ||
        cookTime === undefined ||
        prepTime === undefined ||
        servings === undefined ||
        !category
      ) {
        results.push({
          name,
          success: false,
          message: "Missing required fields",
        });
        continue;
      }

      const existingRecipe = await Recipe.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });
      console.log("existingRecipe : ", existingRecipe);

      if (existingRecipe) {
        results.push({
          name,
          success: false,
          message: "Recipe already exists",
        });
        continue;
      }

      const newRecipe = new Recipe({
        name,
        imageUrl,
        ingredients: ingredients.map((ing) => ({
          name: ing.name,
          isFridgeRequired:
            ing.isFridgeRequired !== undefined ? ing.isFridgeRequired : true,
          quantity: ing.quantity,
          unit: ing.unit || "",
          isAvailable: false,
        })),
        steps,
        cookTime,
        prepTime,
        servings,
        difficulty: difficulty || "Medium",
        category,
        tags: tags || [],
      });

      await newRecipe.save();

      results.push({
        name,
        success: true,
        recipeId: newRecipe._id,
      });
    }

    res.status(201).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search recipes
const searchRecipes = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    let recipes = await Recipe.find({
      name: { $regex: query, $options: "i" },
    });

    const fridgeItems = await Fridge.find({}, "items.name");

    const fridgeSet = new Set(
      fridgeItems[0]["items"].map((item) => item.name?.toLowerCase())
    );

    recipes = recipes.map((recipe) => {
      recipe.ingredients = recipe.ingredients.map((ingredient) => {
        if (ingredient?.isFridgeRequired === true) {
          const ingredientName = ingredient.name
            ? ingredient.name.toLowerCase()
            : "";

          ingredient.isAvailable = fridgeSet.has(ingredientName) ? "yes" : "no";
        }
        return ingredient;
      });
      return recipe;
    });

    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all recipes
const getAllRecipes = async (req, res) => {
  try {
    const { limit, skip, sort } = req.query;

    let query = Recipe.find();

    if (skip) query = query.skip(Number(skip));
    if (limit) query = query.limit(Number(limit));

    if (sort === "newest") {
      query = query.sort({ createdAt: -1 });
    } else if (sort === "oldest") {
      query = query.sort({ createdAt: 1 });
    } else if (sort === "quickest") {
      query = query.sort({ cookTime: 1, prepTime: 1 });
    } else {
      query = query.sort({ name: 1 });
    }

    const recipes = await query.exec();
    const total = await Recipe.countDocuments();

    res.status(200).json({
      recipes,
      total,
      hasMore: skip && limit ? Number(skip) + recipes.length < total : false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecipeSuggestions = async (req, res) => {
  const { user_id } = req.params;
  try {
    const fridge = await Fridge.findOne({ user_id });
    let recipes = [];

    // Get available ingredients from fridge
    const availableIngredients =
      fridge && fridge.items.length > 0
        ? fridge.items.map((item) => item.name.toLowerCase())
        : [];

    // Define ingredient groups for substitutability
    const ingredientGroups = {
      alliums: [
        "onion",
        "pyaaz",
        "garlic",
        "lahsun",
        "shallot",
        "leek",
        "spring onion",
      ],
      tomato_products: [
        "tomato",
        "tamatar",
        "tomato paste",
        "tomato puree",
        "tomato sauce",
      ],
      chilies: [
        "chili",
        "mirch",
        "green chili",
        "hari mirch",
        "red chili",
        "chili powder",
        "chili flakes",
      ],
      ginger: ["ginger", "adrak", "ginger paste", "ginger powder"],
      aromatic_seeds: [
        "cumin",
        "jeera",
        "coriander seeds",
        "dhania",
        "mustard seeds",
        "rai",
        "fenugreek",
        "methi",
      ],
      leafy_herbs: [
        "coriander leaves",
        "dhania patta",
        "mint",
        "pudina",
        "curry leaves",
        "kadi patta",
      ],
    };

    // Normalize text helper function
    const normalize = (str) => {
      if (!str) return "";
      return str.toLowerCase().split("(")[0].trim();
    };

    // Check if an ingredient or any of its group alternatives are available
    const isIngredientOrAlternativeAvailable = (
      ingredient,
      availableIngredients
    ) => {
      const normalizedIngredient = normalize(ingredient);

      // Direct match
      if (
        availableIngredients.some(
          (fridgeIng) => normalize(fridgeIng) === normalizedIngredient
        )
      ) {
        return true;
      }

      // Group match
      for (const [groupName, members] of Object.entries(ingredientGroups)) {
        if (members.some((member) => normalizedIngredient.includes(member))) {
          // If this ingredient belongs to a group, check if any group member is available
          return members.some((groupMember) =>
            availableIngredients.some((fridgeIng) =>
              normalize(fridgeIng).includes(groupMember)
            )
          );
        }
      }

      return false;
    };

    // Set isSuggested flag based on available ingredients
    const isSuggested = availableIngredients.length > 0;

    if (isSuggested) {
      // Fetch all recipes if we have ingredients to match against
      const allRecipes = await Recipe.find();

      // Calculate ingredient frequency across all recipes
      const ingredientFrequency = {};
      const totalRecipes = allRecipes.length;

      allRecipes.forEach((recipe) => {
        const uniqueIngs = new Set(
          recipe.ingredients.map((ing) => normalize(ing.name))
        );
        uniqueIngs.forEach((ing) => {
          ingredientFrequency[ing] = (ingredientFrequency[ing] || 0) + 1;
        });
      });

      // Calculate ingredient importance using TF-IDF concept
      const ingredientImportance = {};
      Object.keys(ingredientFrequency).forEach((ing) => {
        // IDF = log(total recipes / number of recipes with this ingredient)
        ingredientImportance[ing] = Math.log(
          totalRecipes / (ingredientFrequency[ing] || 1)
        );

        // Add a minimum importance value to ensure all ingredients have some weight
        ingredientImportance[ing] = Math.max(0.2, ingredientImportance[ing]);
      });

      // Process each recipe to check ingredient matches with weights
      const processedRecipes = allRecipes.map((recipe) => {
        // Filter only fridge-required ingredients for percentage calculation
        const fridgeRequiredIngredients = recipe.ingredients.filter(
          (ing) => ing.isFridgeRequired
        );

        // Calculate weighted match score
        let weightedMatchScore = 0;
        let totalPossibleScore = 0;

        fridgeRequiredIngredients.forEach((ing) => {
          const normalizedName = normalize(ing.name);
          const weight = ingredientImportance[normalizedName] || 1;

          totalPossibleScore += weight;

          if (
            isIngredientOrAlternativeAvailable(ing.name, availableIngredients)
          ) {
            weightedMatchScore += weight;
          }
        });

        // Calculate weighted percentage
        const matchPercentage =
          totalPossibleScore > 0
            ? (weightedMatchScore / totalPossibleScore) * 100
            : 0;

        // Identify distinctive ingredients (those that appear in less than 30% of recipes)
        const distinctiveIngredients = fridgeRequiredIngredients.filter(
          (ing) => {
            const normalizedName = normalize(ing.name);
            return ingredientFrequency[normalizedName] / totalRecipes < 0.3;
          }
        );

        // Check if recipe has matching distinctive ingredients
        const matchingDistinctiveCount = distinctiveIngredients.filter((ing) =>
          isIngredientOrAlternativeAvailable(ing.name, availableIngredients)
        ).length;

        // Apply a boost if recipe has distinctive ingredients that match
        const distinctiveBoost =
          matchingDistinctiveCount > 0 ? 1 + matchingDistinctiveCount * 0.1 : 1;
        const boostedMatchPercentage = matchPercentage * distinctiveBoost;

        // Calculate true match count for display purposes
        const trueMatchCount = fridgeRequiredIngredients.filter((ing) =>
          isIngredientOrAlternativeAvailable(ing.name, availableIngredients)
        ).length;

        // Update isAvailable flag for each ingredient
        const updatedIngredients = recipe.ingredients.map((ingredient) => {
          const isAvailableInFridge = isIngredientOrAlternativeAvailable(
            ingredient.name,
            availableIngredients
          );

          return {
            ...(ingredient.toObject ? ingredient.toObject() : ingredient),
            isAvailable: isAvailableInFridge,
          };
        });

        // Calculate missing ingredients (only for fridge-required ones)
        const missingIngredients = fridgeRequiredIngredients
          .filter(
            (ing) =>
              !isIngredientOrAlternativeAvailable(
                ing.name,
                availableIngredients
              )
          )
          .map((ing) => ing.name);

        return {
          ...recipe._doc,
          matchCount: trueMatchCount,
          matchPercentage: boostedMatchPercentage,
          originalMatchPercentage: matchPercentage,
          ingredients: updatedIngredients,
          missingIngredients,
          hasDistinctiveMatch: matchingDistinctiveCount > 0,
        };
      });

      // Filter and sort recipes for suggestions
      recipes = processedRecipes
        .filter((recipe) => recipe.matchPercentage >= 30)
        .sort((a, b) => {
          // First prioritize recipes with distinctive matches
          if (a.hasDistinctiveMatch && !b.hasDistinctiveMatch) return -1;
          if (!a.hasDistinctiveMatch && b.hasDistinctiveMatch) return 1;

          // Then sort by match percentage
          return b.matchPercentage - a.matchPercentage;
        })
        .slice(0, 3); // Top 3 matches
    } else {
      // If no ingredients available, just fetch 3 random recipes
      const randomRecipes = await Recipe.aggregate([{ $sample: { size: 3 } }]);

      // Update with default values for consistency
      recipes = randomRecipes.map((recipe) => {
        const updatedIngredients = recipe.ingredients.map((ingredient) => ({
          ...ingredient,
          isAvailable: false,
        }));

        // Calculate missing ingredients for display purposes
        const missingIngredients = recipe.ingredients
          .filter((ing) => ing.isFridgeRequired)
          .map((ing) => ing.name);

        return {
          ...recipe,
          ingredients: updatedIngredients,
          missingIngredients,
          matchCount: 0,
          matchPercentage: 0,
          originalMatchPercentage: 0,
          hasDistinctiveMatch: false,
        };
      });
    }

    // Return the recipes array with the isSuggested flag
    res.json({
      recipes,
      isSuggested,
    });
  } catch (err) {
    console.error("Recipe suggestion error:", err);
    res.status(500).json({ error: err.message });
  }
};

const recipesToUpdate = [
  //   {
  //     name: "Paneer Butter Masala",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737931/Paneer_Butter_Masala_iehxic.webp",
  //   },
  {
    name: "Aloo Paratha",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737930/Aloo_Paratha_r6vzwm.webp",
  },
  //   {
  //     name: "Chole Bhature",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737929/Chole_Bhature_oexquu.webp",
  //   },

  //   {
  //     name: "Masala Dosa",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737929/Masala_Dosa_v0vpki.webp",
  //   },
  //   {
  //     name: "Vegetable Biryani",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737930/Vegetable_Biryani_dj8www.webp",
  //   },
  //   {
  //     name: "Gulab Jamun",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737931/Gulab_Jamun_reqzxv.webp",
  //   },
  //   {
  //     name: "Maggi Noodles",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737928/Maggi_Noodles_lcpo2d.webp",
  //   },
  {
    name: "Egg Bhurji",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737928/Egg_Bhurji_xiyt9x.webp",
  },
  {
    name: "Bread Omelette",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737927/Bread_Omelette_vknv4o.webp",
  },
  //   {
  //     name: "Vegetable Fried Rice",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737927/Vegetable_Fried_Rice_yg4jwl.webp",
  //   },
  //   {
  //     name: "Peanut Butter Sandwich",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737927/Peanut_Butter_Sandwich_axkoik.webp",
  //   },
  //   {
  //     name: "Poha",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737926/Poha_sjbaww.webp",
  //   },
  {
    name: "Dal Tadka",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737926/Dal_Tadka_n3ix2o.webp",
  },
  //   {
  //     name: "Besan Chilla",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737925/Besan_Chilla_azucex.webp",
  //   },
  //   {
  //     name: "Curd Rice",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737924/Sabudana_Khichd_fj4lyr.webp",
  //   },
  //   {
  //     name: "Sooji Halwa",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737927/Sooji_Halwa_ck9oax.webp",
  //   },
  //   {
  //     name: "Rajma Chawal",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737953/Rajma_Chawal_rfjqwk.webp",
  //   },
  //   {
  //     name: "Sambar",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737925/Sambar_nmhc99.webp",
  //   },
  //   {
  //     name: "Pulao",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737924/Pulao_mztyfe.webp",
  //   },
  //   {
  //     name: "Sabudana Khichdi",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737924/Sabudana_Khichd_fj4lyr.webp",
  //   },
  //   {
  //     name: "Moong Dal Chilla",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737924/Moong_Dal_Chilla_hgs25h.webp",
  //   },
  {
    name: "Vegetable Pulao",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737924/Vegetable_Pulao_de69ph.webp",
  },
  //   {
  //     name: "Vegetable Soup",
  //     imageUrl:
  //       "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737923/Vegetable_Soup_y0zrt2.webp",
  //   },

  {
    name: "Aloo Jeera",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1745312541/ChatGPT_Image_Apr_22_2025_02_32_09_PM_vp7lsk.png",
  },
  {
    name: "Kathal Curry",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1745489928/Kathal_Curry_ig5m7z.png",
  },
  {
    name: "Fish Curry",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1745489923/Fish_curry_tjd9fe.png",
  },
  {
    name: "Chicken Curry",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1745489924/Chicken_Curry_jg0dl7.png",
  },
  {
    name: "Egg Curry",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1745489922/Egg_curry_oddvvn.png",
  },
  {
    name: "Kadai Paneer",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1745489920/Kadai_Paneer_c9b0no.png",
  },
  {
    name: "Cabbage Stir Fry",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1745489826/Cabbage_Stir_Fry_a9nqhb.png",
  },
  {
    name: "Bhindi Masala",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1745489818/Bhindi_masala_blkfin.png",
  },
  {
    name: "Jeera Aloo",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1745312541/ChatGPT_Image_Apr_22_2025_02_32_09_PM_vp7lsk.png",
  },
  {
    name: "Aloo Gobi",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1745312303/ChatGPT_Image_Apr_22_2025_02_13_50_PM_vltbwm.png",
  },
  {
    name: "Kurkuri Bhindi",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1745490422/Kurkuri_Bhindi_egxtkh.png",
  },
  {
    name: "Lotus Root Curry",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1745490420/Lotus_Root_Curry_vqoeoo.png",
  },
  {
    name: "Masala Dosa",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1740737929/Masala_Dosa_v0vpki.webp",
  },
  {
    name: "Palak Paneer",
    imageUrl:
      "https://res.cloudinary.com/dwm0ojiz8/image/upload/v1745490705/Palak_Paneer_wgpnwk.png",
  },
];

const updateRecipeImages = async () => {
  try {
    const bulkOps = recipesToUpdate.map((recipe) => ({
      updateOne: {
        filter: { name: recipe.name },
        update: { $set: { imageUrl: recipe.imageUrl } },
      },
    }));

    const result = await Recipe.bulkWrite(bulkOps);
    console.log(`${result.modifiedCount} recipes updated.`);
  } catch (error) {
    console.error("Error updating recipes:", error);
  }
};

// updateRecipeImages();

module.exports = {
  getAllRecipeNames,
  addRecipesInArray,
  searchRecipes,
  getAllRecipes,
  getRecipeSuggestions,
};
