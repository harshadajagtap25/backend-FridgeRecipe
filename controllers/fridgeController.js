const Fridge = require("../models/Fridge");
const Recipe = require("../models/Recipe");

// Add item to fridge

const addItemsToFridge = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Valid items array is required" });
    }

    let fridge = await Fridge.findOne({ user_id });

    if (!fridge) {
      fridge = new Fridge({
        user_id,
        items: [],
      });
    }

    const results = [];

    for (const item of items) {
      const { name, quantity, unit, category, expiryDate } = item;

      if (!name || !quantity || !unit) {
        results.push({
          name: name || "Unknown",
          success: false,
          message: "Missing required fields",
        });
        continue;
      }

      const existingItemIndex = fridge.items.findIndex(
        (fridgeItem) => fridgeItem.name.toLowerCase() === name.toLowerCase()
      );

      if (existingItemIndex !== -1) {
        fridge.items[existingItemIndex].quantity += Number(quantity);

        if (expiryDate) {
          fridge.items[existingItemIndex].expiryDate = new Date(expiryDate);
        }
        results.push({
          name,
          success: true,
          message: "Item quantity updated",
          quantity: fridge.items[existingItemIndex].quantity,
        });
      } else {
        const newItem = {
          name,
          quantity: Number(quantity),
          unit,
          category,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          addedAt: new Date(),
        };
        fridge.items.push(newItem);
        results.push({
          name,
          success: true,
          message: "Item added successfully",
          item: newItem,
        });
      }
    }

    await fridge.save();
    res.status(200).json({
      fridgeId: fridge._id,
      userId: user_id,
      results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get fridge inventory
const getFridgeInventory = async (req, res) => {
  try {
    const { user_id } = req.params;

    const fridge = await Fridge.findOne({ user_id });

    if (!fridge) {
      return res.status(200).json({ user_id, items: [] });
    }

    res.status(200).json(fridge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove item from fridge
const removeItemFromFridge = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Item id is required" });
    }

    const fridge = await Fridge.findOne({ user_id });

    if (!fridge) {
      return res.status(404).json({ message: "Fridge not found" });
    }

    fridge.items = fridge.items.filter(
      (item) => item.id.toLowerCase() !== id.toLowerCase()
    );

    await fridge.save();
    res.status(200).json(fridge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update item quantity (increment/decrement)
const updateItemQuantity = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { name, action, amount = 1 } = req.body;

    if (!name || !action) {
      return res.status(400).json({
        message: "Item name and action (increment/decrement) are required",
      });
    }

    const fridge = await Fridge.findOne({ user_id });

    if (!fridge) {
      return res.status(404).json({ message: "Fridge not found" });
    }

    const itemIndex = fridge.items.findIndex(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in fridge" });
    }

    if (action === "increment") {
      fridge.items[itemIndex].quantity += Number(amount);
    } else if (action === "decrement") {
      fridge.items[itemIndex].quantity -= Number(amount);

      if (fridge.items[itemIndex].quantity <= 0) {
        fridge.items.splice(itemIndex, 1);
      }
    } else {
      return res
        .status(400)
        .json({ message: "Invalid action. Use 'increment' or 'decrement'" });
    }

    await fridge.save();
    res.status(200).json(fridge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addItemsToFridge,
  getFridgeInventory,
  removeItemFromFridge,
  updateItemQuantity,
};
