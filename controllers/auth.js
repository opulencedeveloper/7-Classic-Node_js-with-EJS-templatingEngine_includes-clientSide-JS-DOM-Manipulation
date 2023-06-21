const crypto = require("crypto");

const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

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
  let errorMessage = req.flash("error");

  if (errorMessage.length > 0) {
    errorMessage = errorMessage[0];
  } else {
    errorMessage = null;
  }

  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: errorMessage,
    oldUserInput: { email: "", password: "" },
    validationErrors: [],
  });
};

exports.getSignup = (req, res, next) => {
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
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
    console.log("errors received");

    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldUserInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email or password",
          oldUserInput: {
            email: email,
            password: password,
          },
          validationErrors: [],
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid email or password",
            oldUserInput: {
              email: email,
              password: password,
            },
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
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const errors = validationResult(req);
  console.log("errors.array()");
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldUserInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }

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
      res.redirect("/login");
      return transporter.sendMail({
        to: email,
        from: "myshop@opulence-node.com",
        subject: "SignUp Succeeded",
        html: "<h1>You signed up successfully!</h1>",
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
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

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "User does not exist");
          return res.redirect("/reset");
        }
        user.resetPasswordToken = token;
        user.resetPasswordTokenExpiration = Date.now() + 3600000;
        console.log("YOUR TOKEN IS", token);
        res.redirect("/");
        user.save().then((result) => {
          console.log("YOUR TOKEN IS SENT");
          transporter.sendMail({
            to: req.body.email,
            from: "myshop@opulence-node.com",
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
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({
    resetPasswordToken: token,
    resetPasswordTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
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
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetPasswordToken: passwordToken,
    resetPasswordTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      console.log(resetUser);
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
      return next(error);
    });
};
