// middlewares/isAdmin.js

module.exports = function isAdmin(req, res, next) {
  // Eğer kullanıcı oturum açtıysa ve admin rolündeyse izin ver
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }

  // Eğer kullanıcı yoksa → login'e yönlendir
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  // Kullanıcı var ama admin değilse
  return res.status(403).send("🛑 Bu sayfaya erişim yetkiniz yok.");
};
