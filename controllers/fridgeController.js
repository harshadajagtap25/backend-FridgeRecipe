const Fridge = require("../models/Fridge");

// Add an item to the fridge
exports.addItemToFridge = async (req, res) => {
  console.log("first item added");
  try {
    const { user_id } = req.params;
    const { name, quantity, unit } = req.body;

    console.log("usr id: ", user_id);
    console.log("name : quality : unit ", name, quantity, unit);
    if (!name || !quantity || !unit) {
      return res
        .status(400)
        .json({ error: "Please provide name, quantity, and unit" });
    }

    const userIdStr = String(user_id);

    // Find the user's fridge or create a new one if it doesn't exist
    let fridge = await Fridge.findOne({ user_id: userIdStr });
    console.log("fridge ", fridge);

    if (!fridge) {
      fridge = new Fridge({ user_id, items: [] });
    }

    // Add the item to the fridge
    fridge.items.push({ name, quantity, unit });
    await fridge.save();

    res.status(201).json({ message: "Item added successfully!", fridge });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// Get user's fridge inventory
exports.getFridgeInventory = async (req, res) => {
  const { user_id } = req.params;
  try {
    const fridge = await Fridge.findOne({ user_id });
    if (!fridge) {
      return res.status(404).json({ msg: "Fridge not found" });
    }
    res.json(fridge.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add an item to the fridge
exports.addItemToFridge = async (req, res) => {
  const { user_id } = req.params;
  const { item } = req.body;
  try {
    let fridge = await Fridge.findOne({ user_id });
    if (!fridge) {
      fridge = new Fridge({ user_id, items: [] });
    }
    fridge.items.push(item);
    await fridge.save();
    res.json(fridge.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove an item from the fridge
exports.removeItemFromFridge = async (req, res) => {
  const { user_id } = req.params;
  const { item } = req.body;
  try {
    const fridge = await Fridge.findOne({ user_id });
    if (!fridge) {
      return res.status(404).json({ msg: "Fridge not found" });
    }
    fridge.items = fridge.items.filter((i) => i !== item);
    await fridge.save();
    res.json(fridge.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get top 3 recipe ideas based on fridge contents
exports.getRecipeSuggestions = async (req, res) => {
  const { user_id } = req.params;
  try {
    const fridge = await Fridge.findOne({ user_id });
    if (!fridge) {
      return res.status(404).json({ msg: "Fridge not found" });
    }
    const availableIngredients = fridge.items;
    const recipes = await Recipe.find({
      ingredients: { $in: availableIngredients },
    }).limit(3);

    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
