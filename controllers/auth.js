//this built in libarry helps us to generate token(values), which we used here for set password token generation
//can be used for other cases anyway, like sending email verification after sign up
const crypto = require("crypto");

const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

//this extracted fn helps us receive he result of the check() fn in the auth.js file in the routes folder
const { validationResult } = require("express-validator");

const User = require("../models/user");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

exports.getLogin = (req, res, next) => {
  //the flash() fn was added by the Flash package, when we added a middle ware for it in app.js
  //check app.js where I imported this package to know what this package does
  //this value is set when we try to login with invalid credentials, in the postLogin fn route in this file
  let errorMessage = req.flash("error");

  if (errorMessage.length > 0) {
    errorMessage = errorMessage[0];
  } else {
    errorMessage = null;
  }

  //const isLoggedIn = req.get("Cookie").trim().split("=")[1];
  //in app.js since we have already set a path to the folder(view) where the templating engine files is stored
  // we just complete the pathname to the templating engine here in the first argument below,
  //the second argument is the data we are passing to this view
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: errorMessage,
    oldUserInput: { email: "", password: "" },
    validationErrors: [],
  });
};

exports.getSignup = (req, res, next) => {
  //the flash() fn was added by the Flash package, when we added a middle ware for it in app.js
  //check app.js where I imported this package to know what this package does
  //this value is set when we try to sign up with invalid credentials, in the postSignup fn route in this file
  let errorMessage = req.flash("error");

  if (errorMessage.length > 0) {
    errorMessage = errorMessage[0];
  } else {
    errorMessage = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: errorMessage,
    oldUserInput: { email: "", password: "", confirmPassword: "" },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  //Max-Age: is in seconds which indicated how long the cookie should stay around
  //Secure : means that this cookie won't be set if youre using http
  //HttpOnly : means that you can't access this Cookie from the Client side
  //Domain: is the domain you are sending the cookie, this is normally used by google for tracking
  //you can look up how this works on youtube
  //----CODE BELOW-----
  // res.setHeader(
  //   "Set-Cookie",
  //   "loggedIn=true; Max-Age=10, Secure HttpOnly Domain='insert domain'"
  // );

  //validationResult() is coming from the express validaton package, which we use to catch error thrown in auth.js file in the route folder.
  //since we did userValidation in the auth.js file in the routes folder, where we attached a check fn for validation in the route the called this fn,
  //we extract the result of that operation here
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
    console.log("errors received");

    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      //this was added to persisit user Input incase there is an error that causes the page to reload which looses the userData
      oldUserInput: {
        email: email,
        password: password,
      },
      //this was added to add or remove CSS classes
      validationErrors: errors.array(),
    });
  }
  //'session' is an object that was created and stored to the req. object in app.js file behind the scene when be imported 'MongoDBStore'
  //here we stored a value in the session object, which is 'req.session.isLoggedIn = true;',
  //here the the Next-Session package creates two values session-cookie(the one we sent and stored in the browser) and the session(the one we stored in the db)
  //the session-cookie is what we use to send request to protected resources, this session-cookie is used to identify the session stored in the db,
  //so the session-cookie is the session identfier, if its valid, we can now access the value we stored in that session obj,
  //eg. 'req.sesssion.isLoggin = true' we created here, which we can only reached if the session-cookie can identofy the session that created it on the db
  //the session-cookie and session are created, store and mananged for us in by the Express-Session package..
  //findOne is given to us on by the Mongoose package, which it adds to any class object we instantiate
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email or password",
          //this was added to persisit user Input incase there is an error that causes the page to reload which looses the userData
          oldUserInput: {
            email: email,
            password: password,
          },
          //this was added to add or remove CSS classes,
          //this makes the input field of email and password 'red'
          validationErrors: [],
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            //we stored a value in the session object
            //we are storing a value in the session object, that is already created by the express-session pacjkage
            //for us ready to be saved to the collection, you can see how this is stored in the session collection
            req.session.isLoggedIn = true;
            req.session.user = user;
            //save saves the session to the session collection
            return req.session.save((err) => {
              console.log(err);
              //do not forget that redirect means executes the code in the app.js file
              res.redirect("/");
            });
          }
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid email or password",
            //this was added to persisit user Input incase there is an error that causes the page to reload which looses the userData
            oldUserInput: {
              email: email,
              password: password,
            },
            //this was added to add or remove CSS classes,
            //this makes the input field of email and password 'red'
            validationErrors: [{ param: "email", param: "email" }],
          });
        })
        .catch((err) => {
          console.log(err);
          redirect("/login");
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

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  //since we did userValidation in the auth.js file in the routes folder, where we attached a check fn for validation in this routes,
  //we extract the result of that operation here
  const errors = validationResult(req);
  console.log("errors.array()");
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      //this is used to presisit user input accross request
      oldUserInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      },
      //we use this add or remove CSS classes in our vire
      validationErrors: errors.array(),
    });
  }

  //the second value passed to hash is how strong the password harshing will be
  //the higher the value, the longer it will take to process it,
  //but the value of 12 is ok and accepted as highly secured
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then((result) => {
      //redirecting means running app.js file again
      res.redirect("/login");
      return transporter.sendMail({
        to: email,
        from: "myshop@opulence-node.com", //go to the Sendgrid website to verify this Sender Identity, or create one
        subject: "SignUp Succeeded",
        html: "<h1>You signed up successfully!</h1>",
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

exports.postLogout = (req, res, next) => {
  //destroy is a method given to us by the express-session package
  //which is used to delete this user specific session.
  //the function passed to it is called when its done destroying the session
  //which means req.session will no longer be availble.
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  //the flash() fn was added by the Flash package, when we added a middle ware for it in app.js
  //check app.js where I imported this package to know what this package does
  //this value is set when we try to sign up with invalid credentials,
  //in the postReset fn route in this file
  let errorMessage = req.flash("error");

  if (errorMessage.length > 0) {
    errorMessage = errorMessage[0];
  } else {
    errorMessage = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: errorMessage,
  });
};

//route can be used to send a verify email code to email
exports.postReset = (req, res, next) => {
  //32 means, 32 random bytes, you van reduce this to get a short value
  //the second argument passed to randomBytes is a fn that is called
  //ones its done genearation the random unique value
  crypto.randomBytes(32, (err, buffer) => {
    //you can flash an error message here if you wanted to
    //check the login route if you dont know what flashing a message means
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    //we are passing 'hex' here to help toString converst hex values to normal ASCII characters
    //since 'buffer' returns hex values
    const token = buffer.toString("hex");
    //findOne() is given to us by Mongoose behind the scene which it adds for every Class object we isntantiate
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          //the flash() fn was added by the Flash package, when we added a middle ware for it in app.js
          //check app.js where I imported this package to know what this package does
          //The first argument passed to flash is the message key, the second arguement is the value
          req.flash("error", "User does not exist");
          return res.redirect("/reset");
        }

        //here we are adding the reset token to currenty found user object, and storing it to the users collection
        user.resetPasswordToken = token;

        //3600000 is in milisecs and this is 1hr, so the token is valid for 1 hour
        user.resetPasswordTokenExpiration = Date.now() + 3600000;

        //this saves these values to the users collection, users collection bcus Mongoose uses
        //the class name and pluralizes it and uses it for the collection name, you already know this
        console.log("YOUR TOKEN IS", token);
        res.redirect("/");
        user.save().then((result) => {
          console.log("YOUR TOKEN IS SENT");
          transporter.sendMail({
            to: req.body.email,
            from: "myshop@opulence-node.com", //go to the Sendgrid website to verify this Sender Identity, or create one
            subject: "Password Reset",
            html: `
                <p>You requested a password reset</p>
                <p>Code valid for an hour</p>
                <p>Click this <a href='http://localhost:3000/reset/${token}'>link</a> to set a new password.</p>
                `,
          });
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
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  //checking if the token sent to the email, matches the one we are extracting here.
  //since we stored this token in the users collection, we find the user that owns this token
  //findOne() is given to us by Mongoose behind the scene which it adds for every Class object we isntantiate
  //since we stored our token in the user collection, it uses the token field to find the user that owns that token,
  //if it finds a valid token, it will check if the expiry date of that token is still valid in the same user it found the token.
  //resetPasswordToken and resetPasswordTokenExpiration is the field in the users collection
  //'$gt' stands for greater than, we check if the resetPasswordTokenExpiration Date is greater than now
  //if its still in the future, if yes, then the token is still valid, then, if all the values passed to findOne are met ,the 'then' block will be reached
  User.findOne({
    resetPasswordToken: token,
    //checks the expiry data of that specifuc token if token exist
    resetPasswordTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      //the flash() fn was added by the Flash package, when we added a middle ware for it in app.js
      //check app.js where I imported this package to know what this package does,
      //checking other routes if youve forgotten how flash() works
      let errorMessage = req.flash("error");

      if (errorMessage.length > 0) {
        errorMessage = errorMessage[0];
      } else {
        errorMessage = null;
      }

      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: errorMessage,
        //we are including userId so we can use it and find this user to update the password
        userId: user._id.toString(),
        passwordToken: token,
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

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  //findOne() is given to us by Mongoose behind the scene which it adds for every Class object we isntantiate
  //resetPasswordToken and resetPasswordTokenExpiration is the field in the users collection
  //'$gt' stands for greater than, we check if the resetPasswordTokenExpiration Date is greater than now
  //if its still in the future, if yes, then the token is still valid, then, if all the values passed to findOne are met ,the 'then' block will be reached
  User.findOne({
    resetPasswordToken: passwordToken,
    resetPasswordTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      console.log(resetUser);
      //the second value passed to hash is how strong the password harshing will be
      //the higher the value, the longer it will take to process it,
      //but the value of 12 is ok and accepted as highly secured
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      console.log("againnnnn", resetUser);
      resetUser.password = hashedPassword;
      resetUser.resetPasswordToken = undefined;
      resetUser.resetPasswordTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
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
