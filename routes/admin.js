// routes/admin.js
const express = require('express');
const router = express.Router();
const isAdmin = require('../middlewares/isAdmin');
const { Op } = require("sequelize"); // Dosyanın başına ekle
const isAuthenticated = require('../middlewares/auth');
const { Payment } = require('../models');
const { AvailableDate } = require('../models');
const bcrypt = require('bcryptjs');

// Modeller

const { User, Hotel, Reservation, Review} = require('../models');





router.get('/', isAdmin, async (req, res) => {
  try {
    const user = req.session.user;
    const {
      username,
      role,
      hotelName,
      resUser,
      resHotel,
      startDate,
      endDate
    } = req.query;

    // Kullanıcı filtreleme
    const userFilter = {};
    if (username) userFilter.username = { [Op.like]: `%${username}%` };
    if (role && role !== 'all') userFilter.role = role;

    // Otel filtreleme
    const hotelFilter = {};
    if (hotelName) hotelFilter.name = { [Op.like]: `%${hotelName}%` };

    // Rezervasyon filtreleme
    const reservationWhere = {};
    if (startDate && endDate) {
      reservationWhere.start_date = { [Op.between]: [startDate, endDate] };
    }

    const reservationInclude = [
      {
        model: User,
        where: resUser ? { username: { [Op.like]: `%${resUser}%` } } : undefined
      },
      {
        model: Hotel,
        where: resHotel ? { name: { [Op.like]: `%${resHotel}%` } } : undefined
      }
    ];

    const users = await User.findAll({ where: userFilter });
    const hotels = await Hotel.findAll({ where: hotelFilter });
    const reservations = await Reservation.findAll({
      where: reservationWhere,
      include: reservationInclude
    });

    // Sayımlar
    const totalUsers = await User.count();
    const totalCustomers = await User.count({ where: { role: 'customer' } });
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
      totalReviews,
      filters: {
        username, role, hotelName, resUser, resHotel, startDate, endDate
      }
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


router.post("/toggle-status/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).send("Kullanıcı bulunamadı");

    await user.update({ is_active: !user.is_active });

    res.redirect("/admin"); // Admin paneline geri dön
  } catch (err) {
    console.error("Kullanıcı durumu değiştirilirken hata:", err);
    res.status(500).send("Bir hata oluştu.");
  }
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

router.post('/odeme/:reservationId', async (req, res) => {
  const { card_number, card_name, expire_date, cvv } = req.body;
  const reservationId = req.params.reservationId;

  try {
    const reservation = await Reservation.findByPk(reservationId, {
      include: [Hotel]
    });

    if (!reservation) return res.status(404).send("Rezervasyon bulunamadı.");

    const days = Math.ceil(
      (new Date(reservation.end_date) - new Date(reservation.start_date)) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = days * reservation.Hotel.price_per_night;

    // 💳 (Gerçek senaryoda burada ödeme API'si çağrılır)
    console.log("Ödeme alındı:", card_number, card_name);

    // ✅ 1. Rezervasyonu güncelle
    await Reservation.update(
      { is_paid: true },
      { where: { id: reservationId } }
    );

    // ✅ 2. Ödeme tablosuna kayıt ekle
    await Payment.create({
      reservation_id: reservationId,
      amount: totalPrice,
      method: "Kart", // istersen burada kullanıcıdan alınabilir
      status: "completed"
    });

    res.send("✅ Ödeme başarılı! Rezervasyon onaylandı.");
  } catch (err) {
    console.error("Ödeme sonrası hata:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});


router.get('/user-ekle', (req, res) => {
  res.render('admin/user-ekle');
});

// Kullanıcı ekleme işlemi
router.post('/user-ekle', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    await User.create({ username: name, email, password, role });
    res.redirect('/admin');
  } catch (err) {
    console.error("Kullanıcı ekleme hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});
router.get("/odemeler", async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Reservation,
          include: [Hotel, User] // hotel ve kullanıcı bilgilerini getir
        }
      ],
      order: [["createdAt", "DESC"]],
    });

res.render("admin/odemeler", { odemeler: payments }); // ✅ böyle olmalı
  } catch (err) {
    console.error("Ödeme geçmişi hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});


module.exports = router;