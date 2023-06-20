const fs = require("fs");
const path = require("path");

//this helps us to collect payments from users
const stripe = require("stripe")(process.env.STRIPE_KEY);

const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const Order = require("../models/order");

const ITEMS_PER_PAGE = 2;

//pagination was implemented here
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  //'find()' is a method given to us by Mongoose, which we used here to fetch all products
  //if your are fetching lots of data here, please implement pagination which I am doing here
  //we are using 'countDocuments()' to display which page number to activate
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return (
        Product.find()
          //this skip the number of itemss find return. if find() returns 10 products, and the result of skip() is 3,
          //it will skip the first 3 items and return the rest
          .skip((page - 1) * ITEMS_PER_PAGE)
          //since skip, skips a particular number and returns the rest, this limits the number of items it returns
          .limit(ITEMS_PER_PAGE)
      );
    })
    .then((products) => {
      //in app.js since we have already set a path to the folder(view) where the templating engine files is stored
      // we just complete the pathname to the templating engine here in the first argument below,
      //the second argument is the data we are passing to this view
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
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
  const page = +req.query.page || 1;
  let totalItems;

  //'find()' is a method given to us by Mongoose, which we used here to fetch all products
  //if your are fetching lots of data here, please implement pagination which I am doing here
  //we are using 'countDocuments()' to display which page number to activate
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return (
        Product.find()
          //this skip the number of itemss find return. if find() returns 10 products, and the result of skip() is 3,
          //it will skip the first 3 items and return the rest
          .skip((page - 1) * ITEMS_PER_PAGE)
          //since skip, skips a particular number and returns the rest, this limits the number of items it returns
          .limit(ITEMS_PER_PAGE)
      );
    })
    .then((products) => {
      //in app.js since we have already set a path to the folder(view) where the templating engine files is stored
      // we just complete the pathname to the templating engine here in the first argument below,
      //the second argument is the data we are passing to this view
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
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

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  //'findById()' is a method given to us by Mongoose
  Product.findById(prodId)
    .then((product) => {
      //in app.js since we have already set a path to the folder(view) where the templating engine files is stored
      // we just complete the pathname to the templating engine here in the first argument below,
      //the second argument is the data we are passing to this view
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        //'path 'is just an identify which can be any string, which we use to select the active
        //nav bar in the view, which is in the navigation.ejs
        path: "/products",
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

exports.getCart = (req, res, next) => {
  //populate() was given to us by Mongoose,
  //it helps us to access a next path or array in the collection, here we are accesssing the user collection
  //here -> .populate('cart.items.prodctId') we are accessing product id which is inside 'items' which is in the 'cart' field.
  //we can call req.user.populate() because we assigned the user object to the req obj, in
  //auth.js in the controller folder, where the user was found from the db. and logged in, in the exports.postLogin() function
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const cartProducts = user.cart.items;
      //in app.js since we have already set a path to the folder(view) where the templating engine files is stored
      // we just complete the pathname to the templating engine here in the first argument below,
      //the second argument is the data we are passing to this view
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: cartProducts,
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

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  //findById() is a method given to us by Mongoose
  Product.findById(prodId)
    .then((product) => {
      //we can call req.user.addToCart() because we asigned the user object to the req obj, in the
      //in the auth.js file in the controller folder in the exports.postLogin() funtion
      //addToCart was defined by us in the user Model
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
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

exports.postOrder = (req, res, next) => {
  //we can access req.user.name because we stored the user object when we found a user in that database
  //from the controller folder, in the auth.js file, in the exports.postLogin() fn.
  //populate() was given to us by Mongoose,
  //it helps us to access a next path or array in the collection, here we are accesssing the user collection
  //here -> .populate('cart.items.prodctId') we are accessing product id which is inside 'items' which is in the 'cart' field.
  //yes we are accessing the productId, but because we are using populate, the full data of that product with that is will be retrieve,
  //we can call req.user.populate() because we assigned the user object to the req obj, in the
  //auth.js file in the controller folder, where the user was found from the db. and logged in, in the exports.postLogin() fn. recall

  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const cartProducts = user.cart.items.map((i) => {
        return {
          quantity: i.quantity,
          //here we are assessing the id of the product. but because we are using populate() here
          //it will give us the full data of the product with that id.
          //we use '_.doc' to acess these full data
          product: { ...i.productId._doc },
        };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user._id,
        },
        products: cartProducts,
      });
      //save() is given to us by Mongoose which saves data to a collection
      //we are using the current object with just instantiated with values and caling save() on it
      return order.save();
    })
    .then((result) => {
      //we can access req.user.name because we stored the user object when we found a user in the database
      //in the controller folder, in the auth.js file, in the exports.postLogin() fn
      //clearCart was defined by us in the User module
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
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

exports.getOrders = (req, res, next) => {
  //find() is given to us by Mongoose, which is used to fetch all the orders that meets the filter criteria
  //user here is the user Objectm which is the currently logged in user.
  //we can call req.user.getOrders() because we assigned the user object to the req obj, in the
  //auth.js file, where the user was found from the db. in the auth.js file in the controller folder in the exports.postLogin() fn. recall
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      //in app.js since we have already set a path to the folder(view) where the templating engine files is stored
      // we just complete the pathname to the templating engine here in the first argument below,
      //the second argument is the data we are passing to this view
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
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

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  //we can call req.user.removeFromCart() because we assigned the user object to the req obj, in the
  //auth.js file, where the user was found from the db. and logged in, in the controller folder, in the auth.js file, in the exports.postLogin() fn recall
  //removeFromCart() was defined by us in the User model
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
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
exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  //findById() is a method given to us by Mongoose which is adds to any class object we created and initaited
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        //when you call next with an error Object passed to it,
        //express Js will skip every other middle ware and render an error handling middle-ware.
        //this middleware was define in the app.js file by you, whuch is then last middle-ware
        return next(new Error("No order found"));
      }
      //remember we stored the user object in req object when we found the user in one of the middleware in app.js
      //which we accessed here with 'req.user'
      if (order.user.userId.toString() !== req.user._id.toString()) {
        //when you call next with an error Object passed to it,
        //express Js will skip every other middle ware and render an error handling middle-ware.
        //this middleware was define in the app.js file by you, whuch is then last middle-ware
        return next(new Error("Unauthorized"));
      }
      //we stored the invoice file name with the orderId, with 'invoice-' prefix to it
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      //this allows us to set how the pdf be downloaded
      //'inline' which is the default means that the pdf will ve viewed on the browser
      //there is also an atlternative to 'inline' which is ==='attachement'=== which allowed the pdf
      //to be downloaded directly not viewed before downlaod.
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );

      //the agument passed to createWriteStream() is the path we want to store the pdf file
      pdfDoc.pipe(fs.createWriteStream(invoicePath));

      //this forwards the data read from the readStream to the response obj, because the response obj is a
      //wriitable stream, which allows the broswer to download this file step by step in chunks, rather than reading the whole file,
      //with this, the server memory won't be filled if the file is to large, you send the file in chunks. rather than sending the whole file
      //just like putting water in a bucket from a tank, the whole water in the tank can't enter the bucket, so you fetch the water bit by bit.
      //it will be impossibe if you try to put the water from the tank to the bucket at ones,
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
      });
      pdfDoc.text("------------------------");
      let totalPrice = 0;
      //writing all the order for this user to the pdf file
      order.products.forEach((prod) => {
        totalPrice = totalPrice + prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              " - " +
              prod.quantity +
              " x " +
              " $" +
              prod.product.price
          );
      });
      pdfDoc.text("----");
      pdfDoc.text("Total Price: $" + totalPrice);

      pdfDoc.end(); //the notfies that you are done writing the file, then the file it ready to be read

      //===============COMMENTED CODE IS OK TO USE IF YOU ARE REDING LESS FILES BUT ISN'T WHEN THE FILE READING IS MUCH COMING FROM DIFFERENT USER REQUEST===============
      //====AS THIS MIGHT MAKE THE SERVER MEMORY TO EXCEED IF YOU ARE TO READ THE WHOLE FILE AT ONES
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     //when you call next with an error Object passed to it,
      //     //express Js will skip every other middle ware and render an error handling middle-ware.
      //     //this middleware was define in the app.js file by you, whuch is then last middle-ware
      //     return next(err);
      //   }
      //   res.setHeader("Content-Type", "application/pdf");
      //   //this allows us to set how the pdf be downloaded
      //   //'inline' which is the default means that the pdf will ve viewed on the browser
      //   //there is also an atlternative to 'inline' which is ==='attachement'=== which allowed the pdf
      //   //to be downloaded directly not viewed before downlaod.
      //   res.setHeader(
      //     "Content-Disposition",
      //     'inline; filename="' + invoiceName + '"'
      //   );
      //   //this sends the file for download
      //   res.send(data);
      // });
    })
    .catch((err) => {
      //when you call next with an error Object passed to it,
      //express Js will skip every other middle ware and render an error handling middle-ware.
      //this middleware was define in the app.js file by you, whuch is then last middle-ware
      return next(err);
    });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  //populate() was given to us by Mongoose,
  //it helps us to access a next path or array in the collection, here we are accesssing the user collection
  //here -> .populate('cart.items.prodctId') we are accessing product id which is inside 'items' which is in the 'cart' field.
  //we can call req.user.populate() because we assigned the user object to the req obj, in
  
  //auth.js in the controller folder, where the user was found from the db. and logged in, in the exports.postLogin() function

  req.user
    .populate("cart.items.productId")
    .then((user) => {
      products = user.cart.items;
      total = 0;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });

      //extract the stripe session key
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map(p => {
          return {
            //the key name here is given by Stripe
            name: p.productId.title,
            description: p.productId.description,
            amount: p.productId.price * 100, //(* 100) because we want to convert it to cents
            currency: 'usd',
            quantity: p.quantity
          };
        }),   
          //these is the url that Stripe will use to redirect the user if the transaction was successful
          //req.protocol is used to dynamically derive the domain this server is running on(http or https) 
          //req.get is used to dynamically derive our host address
          //but this approach has a flaw, if you manally, enter this url, after clicking order now
          //it will take you to success page which generated an invoice for you based on your cart 
          //products, rewatch the end of the video and know how to tackle this,  or use another payment provider
          //or you implement a method where you tell the user that you are confirming the payment, then you use your Stripe dashborad
          //to confirm manually if the payment was successful, then confrim the user payment manually
          success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
          //these is the url that Stripe will use to redirect the user if the transaction  failed
          cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
      });
    })
    .then((stripeSession) => {
      //in app.js since we have already set a path to the folder(view) where the templating engine files is stored
      // we just complete the pathname to the templating engine here in the first argument below,
      //the second argument is the data we are passing to this view
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: products,
        totalSum: total,
        stripeSessionId: stripeSession.id
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  //we can access req.user.name because we stored the user object when we found a user in that database
  //from the controller folder, in the auth.js file, in the exports.postLogin() fn.
  //populate() was given to us by Mongoose,
  //it helps us to access a next path or array in the collection, here we are accesssing the user collection
  //here -> .populate('cart.items.prodctId') we are accessing product id which is inside 'items' which is in the 'cart' field.
  //yes we are accessing the productId, but because we are using populate, the full data of that product with that is will be retrieve,
  //we can call req.user.populate() because we assigned the user object to the req obj, in the
  //auth.js file in the controller folder, where the user was found from the db. and logged in, in the exports.postLogin() fn. recall

  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const cartProducts = user.cart.items.map((i) => {
        return {
          quantity: i.quantity,
          //here we are assessing the id of the product. but because we are using populate() here
          //it will give us the full data of the product with that id.
          //we use '_.doc' to acess these full data
          product: { ...i.productId._doc },
        };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user._id,
        },
        products: cartProducts,
      });
      //save() is given to us by Mongoose which saves data to a collection
      //we are using the current object with just instantiated with values and caling save() on it
      return order.save();
    })
    .then((result) => {
      //we can access req.user.name because we stored the user object when we found a user in the database
      //in the controller folder, in the auth.js file, in the exports.postLogin() fn
      //clearCart was defined by us in the User module
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
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
