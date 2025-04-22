const express = require("express");
const router = express.Router();

const {
  addItemsToFridge,
  getFridgeInventory,
  removeItemFromFridge,
  updateItemQuantity,
} = require("../controllers/fridgeController");

router.post("/:user_id/add", addItemsToFridge);
router.get("/:user_id/inventory", getFridgeInventory);
router.post("/:user_id/remove", removeItemFromFridge);
router.post("/:user_id/update-quantity", updateItemQuantity);

module.exports = router;
