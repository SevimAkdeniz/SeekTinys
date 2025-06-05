// routes/admin.js
const express = require('express');
const router = express.Router();
const isAdmin = require('../middlewares/isAdmin');

// Modeller

const { User, Hotel, Reservation, Review } = require('../models');

router.get('/', isAdmin, async (req, res) => {
  try {
    const user = req.session.user;
    const hotels = await Hotel.findAll();
    const users = await User.findAll();
    const reservations = await Reservation.findAll({
      include: [
        { model: User },
        { model: Hotel }
      ]
    });

    // Sayımlar
    const totalUsers = await User.count();
    const totalCustomers = await User.count({ where: { role: 'customer' } }); // veya 'user'
    const totalAdmins = await User.count({ where: { role: 'owner' } });
    const totalHotels = await Hotel.count();
    const totalReservations = await Reservation.count();
    const totalReviews = await Review.count();

    res.render('admin/adminPanel', {
      user,
      hotels,
      users,
      reservations,
      totalUsers,
      totalCustomers,
      totalAdmins,
      totalHotels,
      totalReservations,
      totalReviews
    });
  } catch (error) {
    console.error("Admin panel hatası:", error);
    res.status(500).send("Admin panel yüklenemedi.");
  }
});

// Kullanıcı sil
router.post('/delete-user/:id', isAdmin, async (req, res) => {
  await User.destroy({ where: { id: req.params.id } });
  res.redirect('/admin');
});

// Kullanıcıyı admin yap
router.post('/make-admin/:id', isAdmin, async (req, res) => {
  await User.update({ role: 'admin' }, { where: { id: req.params.id } });
  res.redirect('/admin');
});

// Rezervasyon sil
router.post('/delete-reservation/:id', isAdmin, async (req, res) => {
  await Reservation.destroy({ where: { id: req.params.id } });
  res.redirect('/admin');
});


// Kullanıcı düzenleme formunu göster
router.get('/edit-user/:id', isAdmin, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).send("Kullanıcı bulunamadı");
  res.render('admin/editUser', { user });
});

// Kullanıcı bilgilerini güncelle
router.post('/edit-user/:id', isAdmin, async (req, res) => {
  const { username, email, role } = req.body;
  await User.update(
    { username, email, role },
    { where: { id: req.params.id } }
  );
  res.redirect('/admin');
});


router.post('/delete-hotel/:id', isAdmin, async (req, res) => {
  const hotelId = req.params.id;
  await Hotel.destroy({ where: { id: hotelId } });
  res.redirect('/admin');
});


module.exports = router;