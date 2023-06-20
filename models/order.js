const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  products: [
    {
      product: {
        type: Object, //you can define the full Object here, but i just decided just define it as ant Object
        required: true,
      },
      quantity: { type: Number, required: true },
    },
  ],
  user: {
    email: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      //this is used to reference a model which is a class which is used to create a collection
      //here we are making a relation to the user class, which means that a user is related to a order,
      //because a user can create an order.
      //'User' has to be the name of the model you are relating,
      //you also have to state a ref. in the 'Product' model, which we already did,
      //you dont use relation in embedded documents, you only relate two collections and an embeded document is not a collection
      //but a documnet inside a collection, it is already embedded in the collection you are suppose to relate
      //it with
      ref: "User",
    },
  },
});

//The first argument passed to model is the name of the model or class, the second argument is the data
//Note that Mongoose takes youe model name which here is 'Order' and turns it all to lower case and pluralize it
//and use it as the name of your collection,
module.exports = mongoose.model("Order", orderSchema);