const path = require("path");

const express = require("express");

//the package is for validating user Inputs
const { body } = require("express-validator");

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

//note that routes is read from the left to right
router.get("/add-product", isAuth, adminController.getAddProduct);

//get logged in user products
//note that routes is read from the left to right.
router.get("/products", isAuth, adminController.getProducts);

//note that routes is read from the left to right
//body(), this is used for user input validation, check auth.js file in this folder to know how it works
router.post(
  "/add-product",
  [
    body("title").isString().isLength({ min: 3 }).trim(),
    //we are now validating for a file not an ImageUrl. so i commented this out, and file 
    //validation was done by the 'multer' package that is extracting this file for us
    //body("imageUrl").isURL(),
    body("price").isFloat(),
    body("description").isLength({ min: 5, max: 400 }).trim(),
  ],
  isAuth,
  adminController.postAddProduct
);

// //if you have a static route like 'products/delete'.
// //the order matters since this can be seen as a dynamic route in the dynamic route below.
// //so define static route first before its dynamic route
//note that routes is read from the left to right
router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

//note that routes is read from the left to right
//body(), this is used for user input validation, check auth.js file in this folder to know how it works
router.post(
  "/edit-product",
  [
    body("title").isString().isLength({ min: 3 }).trim(),
    //we are now validating for a file not an ImageUrl. so i commented this out, and file 
    //validation was done by the 'multer' package that is extracting this file for us
    //body("imageUrl").isURL(),
    body("price").isFloat(),
    body("description").isLength({ min: 5, max: 400 }).trim(),
  ],
  isAuth,
  adminController.postEditProduct
);

//note that routes is read from the left to right
//delete request do not have a body
router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
