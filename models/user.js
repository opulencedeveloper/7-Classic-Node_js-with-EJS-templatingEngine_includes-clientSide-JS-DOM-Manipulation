const mongoose = require("mongoose");
const product = require("./product");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  // name: {
  //   type: String,
  //   required: true,
  // },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetPasswordToken: String,
  resetPasswordTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          //this is used to reference a model which is a class which is used to create a collection
          //here we are making a relation to the product class, which means that a product is related to a user,
          //because a user can create a product.
          //'Product' has to be the name of the model you are relating,
          //you also have to state a ref. in the 'Product' model, which we already did,
          //you dont use relation in embedded documents, you only relate two collections and an embeded document is not a collection
          //but a documnet inside a collection, it is already embedded in the collection you are suppose to relate
          //it with
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

//this is used to a your own method to this call

userSchema.methods.addToCart = function (product) {
  //findIndex is a fn that can be called in an array
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      productId: product._id, //we should wrap this in a ObjectId but mongoose will do that for us
      quantity: newQuantity,
    });
  }
  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  //save() is a method given to us by Mongoose, which saves the current Object instance to the users collection
  return this.save();
};

userSchema.methods.removeFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  //save is given to us by Mongodb
  return this.save();
};

//The first argument passed to model is the name of the model or class, the second argument is the data
//Note that Mongoose takes youe model name which here is 'User' and turns it all to lower case and pluralize it
//and use it as the name of your collection,
module.exports = mongoose.model("User", userSchema);
