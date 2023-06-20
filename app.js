const path = require("path");
const fs = require("fs");

const express = require("express");
//package helps us to extract text from an incoming request
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");

//package used to store the session on mongodb, there are alternatives, you can check the express-session-package github
//you pass your session package you imported above
const MongoDBStore = require("connect-mongodb-session")(session);

//this package helps us secure our node.js application by setting several HTTP headers that
//helps to protecf against attacks like cross-site-scripting(XSS), clickjacking and cross-site
//request forgery(CSRF)
const helmet = require('helmet');

//this package helps you compress you asset files. and the files you're serving to your user
//like the javascript and css files that runs in the browser except images, most hosting providers do
//this for you
const compression = require('compression');

//this package helps logs the full data of every incoming requst data for http request and response, 
//but this is normally done by the hosting provider, 
//Besides using morgan to log requests in general, you can also add your own log messages in your code.
//For one, you can of course use the good old console.log() command to write logs.
//For a more advanced/ detailed approach on logging (with higher control), see this article: https://blog.risingstack.com/node-js-logging-tutorial/
const morgan = require('morgan');


//this package ensures that only our view sends request to our server for any request that will edit data in db,
//by attaching new session for any view we generate to the client, ,so any request will need a CSRF token,
//this package depends on the session package.
const csrf = require("csurf");

//this package helps us to store a value, in the session object, so that we can use its value to
//dispalay in a view when we re-direct, and deletes it from the session object after we extract it.
// maybe when a user enters an invalid input, and we want to redirect and display an error text to ther user
const flash = require("connect-flash");

//package helps us to extract files from an incoming request
const multer = require("multer");



const rootDir = require("./util/path");
const errorController = require("./controllers/error");
const User = require("./models/user");

//environmental variables for developement are found in the nodemon.json file 
//production environmental variables was inserted in package.json
//I recommened adding it with the hosting provider
const MONGODB_URI =
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.iogciqk.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`;

const app = express();
const store = new MongoDBStore({
  //insert mongoDb connection string
  //please note the session will be stored in the same database as your user data, you can use another data-base or cluster if you want
  uri: MONGODB_URI,
  collection: "sessions",
  //'expires:' ones this time expires, mongodb will clear all session by itself, but i didnt use it here
  //we used another way to clear individual session, but incase you need to this, i want you to know that it is avaliable...
  //expires:
});

const csrfProtection = csrf();

//this is used to configure the file that multer will parse for us, which we are storing
const fileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    //the first argument passed to callback is an error, but if you set it to null, you are telling the 'multer'package that its ok to store the file
    //the second argumemnt is the folder you are storing the file
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    //the first argument passed to callback is an error, but if you set it to null, you are telling the 'multer'package that its ok to store the file
    //the second argumemnt is the name of the file.
    //file.orginalname is the real name of the file coming from the client including the extension.
    //we concatinated 'random' with  file.originalname to avoid files with same names replacing each other
   //but there are packages the helps you with generating unique names for images
    const random = (Math.random() + 1).toString(36).substring(7);
    callback(null, random + "-" + file.originalname);
  },
});

//this is used to filter the kind of file you are accepting with the aid of the multer package
const myFileFilter = (req, file, callback) => {
  //the first argument passed to callback is an error, but if you set it to null, you are telling the 'multer'package that its ok to store the file
  //the second argumemnt is a boolen, when its true, then you want to accept the file passed
  //to the if function and false of not
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

//Sets our app to use the handlebars view engine, here we named it 'hbs' which will be the extenstion name
app.set("view engine", "ejs");
//this sets the folder where the templating engines will be stored(this is the default folder but I just set it here to make it clear)
//the first argument has to be called views, the second argument is
//the name of the folder or path to where the templating engine file are kept
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

//routes runs for every incoming request
//check your headers in the network tab in your browser to check if the headers was added 
app.use(helmet());

//helps to compress the js and css file you are serving to your user except image files
app.use(compression());
//do this before your route middleware if you want to parse the incoming request body
//there are types of body parser to use, eg the one for files, check other gitHub repo or files.
//The extended option allows to choose between parsing the URL-encoded data with the querystring library (when false) or the qs library (when true).
//extended” allows for rich objects and arrays to be encoded into the URL-encoded format,
//this is only used to extract text, we used the 'muter' package to extract files here

//access.log: => is the name of the file
//{ flags: 'a' } => means that new data coming to the file will be appended
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);
//this helps logs the full data of every incoming requst data for http request and response, but this
//is normally done by the hosting provider
//'combine' is how you log the data,
//'accessLogStream' is the file path you'll log it into which we defined above
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: true }));

//this helps us to extract files.
//if youre expecting mutiple files, use 'multer().array',
//'storage' -> is the folder to store this file. we defined the constant 'myFileStorage' above.
//'fileFilter' is used to filer the kind of file you are accepting,
//'myFileFilter' is const defined above
//the parameter passed to single() is the input key name of the file coming from the client. eg the key stored in the req.body,
app.use(
  multer({ storage: fileStorage, fileFilter: myFileFilter }).single("myImage")
);

//this routes serves static files like CSS
//it allows access to the folder(like public) specified here form anywhere.
//it takes any request that is trying to find a file and forwards it to the
//path specified here, you can specify more paths, which is the public folder
app.use(express.static(path.join(rootDir, "public")));
// this is the specific route => ('/images'), 
//"express.static(path.join(rootDir, "images")" exposes this folder to the outside word 
 app.use('/images', express.static(path.join(rootDir, "images")));

//When we log in and created a session-cookie which is like an id and stored it in the browser then stored a session to the db at the same time,
//the session-cookie stored in the browser is an id used to identify that specific session(stored in the db) that was created togther with the session-cookie, this session-cookie is what we use to send request for protected resources, for a specific user.
//which is used to compare with the session stored in the db, if the session is found and still valid, it adds it to the req object, so we can able to access protected resorces
//using 'req.session' object, (14:17). if its not found, then this user session has expired and was removed.
//this middleware runs for every incoming request and manages the cookie session(stored and sent from the client) and session(stored in the db) for us, this means it extract the session cookie sent from the client....
//when we logged in. to look for the fitting session on the db. which was also created when we logged in.
//if it finds one, it will then add the session to the req object. (which is req.session), just as we did when we logged in a user in the auth.js file,
//in the controller folder, so in summary, this checks if a user session is still valid for every incomming req, if yes
//it add a session object to the req object, which we acess through req.session, since the user detail is also stored to the session
//object when we logged in, we can access it using, req.session.user// and since the mongoose packages adds utility method to any class we created
//and the user object happens to be one. we can access this fn using, req.session.user.findById. which we did in the files in the controller folder.
//
//secret should be a long string
//"resave: false ->" i tested this with the value been true, and any user that logs out, resets all the session collection.
//i believe this rewrites or re-initialize the entire session obj. when a session changes, seting it to true only reset the session of the actual user that logged out.
//saveUninitiazlied: ensures that no session is saved for a request that it doesnt need to be saved, because nothing in the session to make it to be saved again
//cookie: {expires: }// this was not added here but it is used for setting how long your session cook will stay before it expires
//store is the db where you stored your session
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
//you need to do this after you initialize the session,
//since we are storing the value we want to display to a user in the session when we rediect
app.use(flash());

//this middleware allow us to pass a value to all the views we render
app.use((req, res, next) => {
  //we access this value with the last object name, which is 'isAuthenticated'.
  //we stored this value on the request.session object when a user logged In, in the controller folder, in the auth.js file in the exports.postLogin fn
  (res.locals.isAuthenticated = req.session.isLoggedIn),
    //we access this value with the last object name, which is 'csrfToken', the key name 'csrfToken' is up to you
    //req.csrfToken(),  was added to the req obj. behind the scene by the CSRF package in the
    //middle ware we used it in, note that we set this token on only views that will edit data in the db,
    //especially, views that has a POST form. that sends a post request.
    (res.locals.csrfToken = req.csrfToken()),
    next();
});

//this route runs for every incoming request
app.use((req, res, next) => {
  //this if function will only be true if the first route of this file, didnt find a valid session in the db
  //so the session object was never added to the req. object, which means this user is not authenticated
  if (!req.session.user) {
    //this skips this route
    return next();
  }
  //findById() was added by mongoose behind the scene, which is available in Class object we create.
  //this route runs for every incoming request so we can use it to get our user obj in every
  //incoming request/
  // since mongoose adds its own method to the user obj or any model(class) we create, this is also included and added to the req.session.user value
  //so we can access the user object value globally through the req obj for only this connection
  //this is same for the 'req.session.isLoggedIn = true;' we added a key to the 'req.session' which is 'isLoggedIn', and gaved it a value -> 'true'

  //since we stored the user object in the session, we could just use it here since we have all thw user data, but all the method added by moongose,
  //like findbyId() wont't be added in the user object, becuse we are calling the user obj on the session object coming from the
  //MongoDb store package and this packaged does not know about the functions added by MOngooose.
  //findById() is a method given to us by Mongoose, which is added to any class object we create.
  //since we stored the user data in this session object when we logged in,
  //we used the userid to find the user by id and stored the user object in the req.user obj.
  //so we can access the user obj globaly including the fn added by Mongose like finById, for this specific request,
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
      //you don't throw an an error like this inside an async code, use 'next()' to reach the error middle-ware.
      //this is wrong -> throw new Error(err); use 'next(Error(err))'

      //when you call 'next()' with an error Object passed to it,
      //express Js will skip every other middle ware and render an error handling middle-ware.
      //this middleware was define in the app.js file by you, whuch is then last middle-ware
      return next(new Error(err));
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

//catch all routes middle-ware, incase non of the routes matches, normally used for 404 pages
app.use(errorController.get404);

//this is an error middle ware which is reached when you passed an error Objext to 'next()'
app.use((error, req, res, next) => {
  //res.redirect('/500');

  //since we have already defined a path to where to templating engine files is stored
  //at the app.js file, we just name the name of the templating engine here in the first argument below,
  //the second argument is the data we are passing to this view
  res.status(500).render("500", {
    pageTitle: "An Error Ocurred",
    //paths is used to select which nav item to select or give a CSS style in the view
    path: null,
    //we stored this value on the request object when a user logged In, in the controller folder, in the auth.js file in the exports.postLogin fn
    isAuthenticated: req.session.isLoggedIn,
  });
  //incase you want to render a page than redirecting
  //res.status(error.httpStatusCode).render(...);
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    //most hosting provider will by defaut inject a 'PORT' environmental variable
    app.listen($process.env.PORT || 3000);
    console.log("Connected");
  })
  .catch((err) => {
    console.log(err);
  });
