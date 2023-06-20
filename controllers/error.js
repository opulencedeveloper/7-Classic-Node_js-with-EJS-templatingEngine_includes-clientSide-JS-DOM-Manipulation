exports.get404 = (req, res, next) => {
  
  //since we have already defined a path to where to templating engine files is stored
  //at the app.js file, we just name the name of the templating engine here in the first argument below,
  //the second argument is the data we are passing to this view
  res.status(404).render("404", {
    pageTitle: "Page Not Found",
    path: null,
    //we stored this value on the request object when a user logged In, in the controller folder, in the auth.js file in the exports.postLogin fn
    isAuthenticated: req.session.isLoggedIn
  });
  //don't call next after you've sent a response becus this will cause an error
  //as sending a response means closing the process
};


exports.get500 = (req, res, next) => {
  
  //since we have already defined a path to where to templating engine files is stored
  //at the app.js file, we just name the name of the templating engine here in the first argument below,
  //the second argument is the data we are passing to this view
  res.status(500).render("500", {
    pageTitle: "An Error Ocurred",
    //paths is used to select which nav item to select or give a CSS style in the view
    path: null,
    //we stored this value on the request object when a user logged In, in the controller folder, in the auth.js file in the exports.postLogin fn
    isAuthenticated: req.session.isLoggedIn
  });
  //don't call next after you've sent a response becus this will cause an error
  //as sending a response means closing the process
};
