const mongoose = require("mongoose");

const fridgeSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  items: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
    },
  ],
});

const Fridge = mongoose.model("Fridge", fridgeSchema);

module.exports = Fridge;
