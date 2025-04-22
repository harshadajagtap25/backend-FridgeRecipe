const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  "/register",
  [
    check("username", "Username is required")
      .not()
      .isEmpty()
      .isLength({ min: 8 })
      .withMessage("Username must be at least 8 characters")
      .custom((value) => {
        if (/\s/.test(value)) {
          throw new Error("Username cannot contain spaces");
        }
        return true;
      }),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 8 characters")
      .isLength({ min: 8 })
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      )
      .not()
      .contains(" ")
      .withMessage("Password cannot contain spaces"),
  ],
  authController.register
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  authController.login
);

// @route   GET api/auth/me
// @desc    Get current user's data
// @access  Private
router.get("/me", auth, authController.getCurrentUser);

module.exports = router;
