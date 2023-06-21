const path = require("path");
const fs = require("fs");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");

const MongoDBStore = require("connect-mongodb-session")(session);

const helmet = require('helmet');

const compression = require('compression');

const morgan = require('morgan');


const csrf = require("csurf");

const flash = require("connect-flash");

const multer = require("multer");



const rootDir = require("./util/path");
const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGODB_URI =
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.iogciqk.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`;

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    const random = (Math.random() + 1).toString(36).substring(7);
    callback(null, random + "-" + file.originalname);
  },
});

const myFileFilter = (req, file, callback) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(helmet());

app.use(compression());
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  multer({ storage: fileStorage, fileFilter: myFileFilter }).single("myImage")
);

app.use(express.static(path.join(rootDir, "public")));
 app.use('/images', express.static(path.join(rootDir, "images")));

app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { expires: 125000000 },
  })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  (res.locals.isAuthenticated = req.session.isLoggedIn),
    (res.locals.csrfToken = req.csrfToken()),
    next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      console.log(err);
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  res.status(500).render("500", {
    pageTitle: "An Error Ocurred",
    path: null,
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen($process.env.PORT || 3000);
    console.log("Connected");
  })
  .catch((err) => {
    console.log(err);
  });
