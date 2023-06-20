const mongoose = require("mongoose");
const fileHelper = require("../util/delete-file");
//see the auth.js file in this folder to see how to display your own error message with aid of this package
//erro was implemented here but we used the default error message the package is giving us
const { validationResult } = require("express-validator");

const Product = require("../models/product");

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  //const imageUrl = req.body.imageUrl;
  //the multer package used in the app.js file is helping us parse this file and added it to the request object with the name 'file'
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  //since we are filtering for which files to accept, the image object wont be set of it doesnt
  //meet the filter criteria in the app.js file
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      //since this route is render when there is an error, to avoid loosing your values, you feed it back to your input
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: "Attached file type is not accepted",
      //this is used to remove and add CSS classes
      validationErrors: [],
    });
  }

  const imageUrl = image.path;

  //this error is passed by the express-validation package fn(body()) that we used in the admin file in the routes folder in this route
  //validationResult() is a fn that is coming from the express-validation package that helps us to extract this error
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    //in app.js since we have already set a path to the folder(view) where the templating engine files is stored
    // we just complete the pathname to the templating engine here in the first argument below,
    //the second argument is the data we are passing to this view
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      //since this route is render when there is an error, to avoid loosing your values, you feed it back to your input
      product: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      //this is used to remove and add CSS classes
      validationErrors: errors.array(),
    });
  }

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    //since se saved the user obj in our req obj when we found a user, we can access the user is here
    userId: req.user._id,
  });

  //'save()' is a method given to us by Mongoose, which out product object and calls saves on it
  //which saves to to our Product schema in model folder

  product
    .save()
    .then((result) => {
      // console.log(result);
      console.log("Created Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
      //const error = new Error('Creating a product failed.');
      const error = new Error(err);
      error.httpStatusCode = 500;
      //when you call next with an error Object passed to it,
      //express Js will skip every other middle ware and render an error handling middle-ware.
      //this middleware was define in the app.js file by you, whuch is then last middle-ware
      return next(error);

      //======CODE BELOW IS AN ALTERNATIVE=====
      // //in app.js since we have already set a path to the folder(view) where the templating engine files is stored
      // // we just complete the pathname to the templating engine here in the first argument below,
      // //the second argument is the data we are passing to this view
      // return res.status(500).render("admin/edit-product", {
      //   pageTitle: "Add Product",
      //   path: "/admin/add-product",
      //   editing: false,
      //   hasError: true,
      //   //since this route is render when there is an error, to avoid loosing your values, you feed it back to your input
      //   product: {
      //     title: title,
      //     imageUrl: imageUrl,
      //     price: price,
      //     description: description,
      //   },
      //   errorMessage: 'Database operation failed, please try again',
      //   //this is used to remove and add CSS classes
      //   validationErrors: [],
      // });
    });
};

exports.getAddProduct = (req, res, next) => {
  //in app.js since we have already set a path to the folder(view) where the templating engine files is stored.
  //we just complete the pathname to the templating engine here in the first argument below,
  //the second argument is the data we are passing to this view
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    //this is used to remove and add CSS classes
    validationErrors: [],
  });
  //don't call next after you've sent a response becus this will cause an error
  //as sending a response means closing the process
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;

  //'findById is a method given to us by Mongoose,
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      //in app.js since we have already set a path to the folder(view) where the templating engine files is stored
      // we just complete the pathname to the templating engine here in the first argument below,
      //the second argument is the data we are passing to this view
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        hasError: false,
        product: product,
        errorMessage: null,
        //this is used to remove and add CSS classes
        validationErrors: [],
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      //when you call next with an error Object passed to it,
      //express Js will skip every other middle ware and render an error handling middle-ware.
      //this middleware was define in the app.js file by you, whuch is then last middle-ware
      return next(error);
    });

  //don't call next after you've sent a response becus this will cause an error
  //as sending a response means closing the process
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  //the multer package used in the app.js file is helping us parse this file and added it to the request object with the name 'file'
  const image = req.file;
  const updatedDesc = req.body.description;

  //this error is passed by the express-validation package fn(body()) that we used in the admin file in the routes folder in this route
  //validationResult() is a fn that is coming from the express-validation package that helps us to extract this error
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    //in app.js since we have already set a path to the folder(view) where the templating engine files is stored
    // we just complete the pathname to the templating engine here in the first argument below,
    //the second argument is the data we are passing to this view
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      //since this route is render when there is an error, to avoid loosing your values, you feed it back to your input
      product: {
        title: updatedTitle,
        //imageUrl: updatedImageUrl,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId,
      },
      errorMessage: errors.array()[0].msg,
      //this is used to remove and add CSS classes
      validationErrors: errors.array(),
    });
  }

  //findById() was given to us by Mongoose, which we used to find a product by Id from the database
  Product.findById(prodId)
    .then((product) => {
      //we can called req.user because we stored the user object on the req object
      //when we found user by id, in one the the middlewares in app.js///
      //since only users whom created a product can edit them.
      //this if fn ensures that this is the right user
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      (product.title = updatedTitle),
        (product.price = updatedPrice),
        (product.description = updatedDesc);
      //if  the user did not add an upload or added a file we did not specify in our filte in app.js
      //the 'images' will be undefined and the code inside the if fn won't run. which means the image field(product.imageUrl) won't be specified here and it won't be changed in the DB.
      //but if the user added an upload(image), then it will be saved to the images file, by the mutler packages, which we used in app.js to parse files
      if (image) {
        //this is the fn we are importing that we created in another folder
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      //'save()' is a method given to us by Mongoose, which out product object and calls saves on it
      //which saves to to our Product schema in model folder
      return product.save().then((result) => {
        console.log("UPDATED PRODUCT!");
        res.redirect("/admin/products");
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      //when you call next with an error Object passed to it,
      //express Js will skip every other middle ware and render an error handling middle-ware.
      //this middleware was define in the app.js file by you, whuch is then last middle-ware
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  //find() is given to us by Mongoose which finds all the product from the 'products' here
  //since we related the user model to the product model and stored the userId of the user that created a product in the product model.
  //select() helps you state which field you want to return from the data base, '-_id' is used to exclude the id,
  //if we fetch data from the product model, the userId will be the id of the user that created the product
  //populate() helps us access the full data of that user not just the id, the second argument passed to populate are the fields you want to retrieve.
  //if you have a nexted path or nexted object-- you can use this -> populate(userId.user) to access it

  //THIS IS THE CODE BELOW(COMMENTED OUT), INCASE YOU NEED THIS FUNCTIONALITY

  // Product.find()
  // .select('title price -_id')
  // .populate('userId', 'name')

  //we can called req.user because we stored the user object on the req object
  //when we found user by id, in one the the middlewares in app.js
  Product.find({ userId: req.user._id })
    .then((products) => {
      console.log(products);
      //in app.js since we have already set a path to the folder(view) where the templating engine files is stored
      // we just complete the pathname to the templating engine here in the first argument below,
      //the second argument is the data we are passing to this view
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      //when you call next with an error Object passed to it,
      //express Js will skip every other middle ware and render an error handling middle-ware.
      //this middleware was define in the app.js file by you, whuch is then last middle-ware
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  //findById is a method given by Mongooose which it addes on any class we created
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        //when you call next with an error Object passed to it,
        //express Js will skip every other middle ware and render an error handling middle-ware.
        //this middleware was define in the app.js file by you, whuch is then last middle-ware
        return next(new Error('Product not found.'));
      }
      //this is the fn we are importing that we created in another folder
      fileHelper.deleteFile(product.imageUrl);
       //deleteOne is a method given by Mongooose which it addes on any class we created
      //we can called req.user because we stored the user object on the req object
      //when we found user by id, in one the the middlewares in app.js
      return Product.deleteOne({ _id: prodId, userId: req.user._id })
    })
    .then(() => {
      console.log("DESTROYED PRODUCT");
      //updating the UI, is now done using client side javascript(see admin.js in the public folder)
      //res.redirect("/admin/products");
      res.status(200).json({message: 'Success! '});
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({message: 'Deleting product failed. '});
      //updating the UI, is now done using client side javascript(see admin.js in the public folder)
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // //when you call next with an error Object passed to it,
      // //express Js will skip every other middle ware and render an error handling middle-ware.
      // //this middleware was define in the app.js file by you, whuch is then last middle-ware
      // return next(error);
    });

  
    
};
