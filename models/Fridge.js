const mongoose = require("mongoose");

const fridgeSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  items: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      category: { type: String, required: false },
      expiryDate: { type: Date, default: null },
      addedAt: { type: Date, default: Date.now },
    },
  ],
});

const Fridge = mongoose.model("Fridge", fridgeSchema);

module.exports = Fridge;
