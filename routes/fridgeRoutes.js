const express = require("express");
const {
  getFridgeInventory,
  addItemToFridge,
  removeItemFromFridge,
  getRecipeSuggestions,
} = require("../controllers/fridgeController");
const router = express.Router();

router.post("/:user_id/add", addItemToFridge);
router.get("/:user_id", getFridgeInventory);
router.delete("/:user_id/remove", removeItemFromFridge);
router.get("/recipe-suggestions/:user_id", getRecipeSuggestions);

module.exports = router;
