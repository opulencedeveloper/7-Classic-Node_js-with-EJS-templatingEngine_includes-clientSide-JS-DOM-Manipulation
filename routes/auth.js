const express = require("express");

const { check, body } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
    body("password", "Password has to be valid.")
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);

router.post(
  "/signUp",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom(async (value, { req }) => {
        const userDoc = await User.findOne({ email: value });
        if (userDoc) {
          return Promise.reject("Email exists already");
        }
      })
      .normalizeEmail(),
    body("password", "Please enter a valid password of at least 5 characters")
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword").trim().custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password has to match");
      }
      return true;
    }),
  ],
  authController.postSignup
);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
