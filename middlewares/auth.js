function isAuthenticated(req, res, next) {
  if (req.session && req.session.user && req.session.user.id) {
    return next(); // Giriş yapılmış, devam et
  }
  res.redirect('/login'); // Giriş yoksa login sayfasına gönder
}

module.exports = isAuthenticated;
