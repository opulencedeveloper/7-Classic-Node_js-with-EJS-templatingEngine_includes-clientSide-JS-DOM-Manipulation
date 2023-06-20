module.exports = (req, res, next) => {
  //the session object is only available to acess the 'isLoggedIn' value if the user has a valid session
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
  next();
};
