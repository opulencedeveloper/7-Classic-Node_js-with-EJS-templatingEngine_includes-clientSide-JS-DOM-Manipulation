const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  //We didnt add an id because MongoDb will be the one to give us an id when we create this product
  title: {
    type: String,
    require: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    //this is used to reference a model which is a class which is used to create a collection
    //here we are making a relation to the users model, which means that a user is related to a product,
    //because a user can create a product.
    //'User' has to be the name of the model you are relating,
    //you also have to state a ref. in the 'User' model, which we already did
    ref: "User",
    required: true
  },
});

//The first argument passed to model is the name of the model or class, the second argument is the data
//Note that Mongoose takes youe model name which here is 'Product' and turns it all to lower case and pluralize it
//and use it as the name of your collection,
module.exports = mongoose.model("Product", productSchema);
