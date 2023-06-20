const express = require("express");

const shopController = require("../controllers/shop");
const isAuth = require('../middleware/is-auth');

const router = express.Router();

//get all products
router.get("/", shopController.getIndex);


router.get("/products", shopController.getProducts);

// //if you have a static route like 'products/delete'.
// //the order matters since this can be seen as a dynamic route in the dynamic route below.
// //so define static route first before its dynamic route

router.get("/products/:productId", shopController.getProduct);

//note that routes is read from the left to right
router.get("/cart", isAuth, shopController.getCart);

//note that routes is read from the left to right
router.post("/cart", isAuth, shopController.postCart);

//note that routes is read from the left to right
router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

//note that routes is read from the left to right
//this was replaced with the '/check/success' route below
//router.post('/create-order', isAuth, shopController.postOrder);

//note that routes is read from the left to right
router.get("/orders", isAuth, shopController.getOrders);

//routes to download invoice(pdf)
router.get('/orders/:orderId', isAuth, shopController.getInvoice);

router.get("/checkout", shopController.getCheckout);

router.get("/checkout/success", shopController.getCheckoutSuccess);

router.get("/checkout/cancel", shopController.getCheckout);


module.exports = router;
