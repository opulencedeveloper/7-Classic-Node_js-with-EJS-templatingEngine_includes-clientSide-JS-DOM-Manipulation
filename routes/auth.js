const express = require("express");

//the package is for validating user Inputs
const { check, body } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

//getting the view
router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

//sending request
//check() and body() is from the express validator package above, for user input validation.
//the value passed to check(), are the field names you are extracting from the route
//of this incoming req, it checks for this field name in the body or in the params pf of the incoming request.
//and checks if its valid and stores the result, while body() only checks values in the body of the incoming req
//custom() is used to include our own validator, the first value passed to it is the field we are validation
//the second value is the req obj, incase you want to work with it
//then you can now go to your controller function and work with the result of this fn.
//expcept for the '.isEmail()' validator, there are way more of this validator, is .isAlphaNumeric,
//check the express-validator official docx
//.normalizeEmail() converts email to lower case
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

//check() and body() is from the express validator package above, for user input validation.
//the value passed to check(), are the field names you are extracting from the route
//of this incoming req, it checks for this field name in the body or in the params pf of the incoming request.
//and checks if its valid and stores the result, while body() only checks values in the body of the incoming req
//custom() is used to include our own validator, the first value passed to it is the field we are validation
//the second value is the req obj, incase you want to work with it
//then you can now go to your controller function and work with the result of this fn.
//expcept for the '.isEmail()' validator, there are way more of this validator, is .isAlphaNumeric,
//check the express-validator official docx
router.post(
  "/signUp",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom(async (value, { req }) => {
        //------------ANOTHER WAY OF DOING THIS------------------
        // if (value === "test@test.com") {
        //   //this error is then receive in this route fn which is authController.postSignup..
        //   //which we now render the message to the view
        //   throw new Error("This email address is forbidden");
        // }
        // //this signals that this validation was successful
        // return true;

        //findOne is a fn that was given to us by Mongoose, and is added for any class we craated and Instantaite
        //'email:' is a field in the users collection
        //'value' is the req field we are checking, which is the email
        const userDoc = await User.findOne({ email: value });
        if (userDoc) {
          //"Promise.reject" This throws an error inside a Promise
          //since 'custom()' expects a boolen or a promise. if we return true, then the validation was successful
          //if we return false or failed promise as we doing below, then this will be treated as an error
          //then the value will be passed to this route controller fn. where here it is 'authController.postSignup()'
          //where we now extracted the error with the help of the 'validationResult' fn which is coming from the 'express-validator';
          //so the same package the is storing this error message for us
          return Promise.reject("Email exists already");
        }
      })
      .normalizeEmail(),
    //the second value passed to body() is the default error message, incase you don't specify one
    body("password", "Please enter a valid password of at least 5 characters")
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    //custom(): explained above
    body("confirmPassword").trim().custom((value, { req }) => {
      if (value !== req.body.password) {
        //this error is then receive in this route fn which is authController.postSignup..
        //which we now render the message to the view
        throw new Error("Password has to match");
      }
      //this signals that this validation was successful
      return true;
    }),
  ],
  authController.postSignup
);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

//it has to be named token, because we are extracting it like this in the getNewPassword() function
router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
