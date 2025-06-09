const express = require("express")
const app = express()
const path = require("path");
require("dotenv").config();

const sequelize = require("./config/database"); //  MySQL Bağlantısı
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRouter");
const hotelsRoute = require('./routes/hotels');
const kiraciHotelRoutes = require('./routes/kiraci/hotels');
const session = require("express-session");
const adminRoutes = require('./routes/admin');
const Hotel = require("./models/hotels")
const HotelImage = require("./models/hotelImage")
const isAuthenticated = require('./middlewares/auth'); // yol dosya yapına göre değişebilir
const User = require("./models/users");
const flash = require('connect-flash');

app.use(express.static(path.join(__dirname, 'public')));


const db = require('./models'); // tüm ilişkiler bu şekilde çekilecek

app.use('/uploads', express.static('public/uploads'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
const AvailableDate = require('./models/availableDate');





sequelize.sync() 
    .then(() => {
        console.log("✅ MySQL veritabanı senkronize edildi");

        // ✅ Sunucuyu Başlat
        app.listen(3000, () => {
            console.log("🚀 Sunucu 3000 portunda çalışıyor...");
        });
    })
    .catch(err => console.error("❌ Veritabanı senkronizasyon hatası:", err));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));


app.use(session({
  secret: "gizli_kelime", // .env'e koyabilirsin
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// Flash mesajlarını her response'ta erişilebilir yap
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

app.use('/kiraci', kiraciHotelRoutes);
app.use(authRoutes);
app.use('/host', hotelsRoute);



app.use('/admin', adminRoutes);


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));








    
app.get("/hotels", (req, res) => {
  const role = req.session.userRole;

  if (role === "admin") {
    res.redirect("/admin-panel");
  } else if (role === "customer") {
    res.redirect("/kiraci/hotels");
  } else {
    res.redirect("/host/ilanlarim");
  }
});

    
app.get("/rezervasyon", (req, res) => {
  const role = req.session.userRole;

  if (role === "admin") {
    res.redirect("");
  } else if (role === "customer") {
    res.redirect("/kiraci/rezervasyonlarim");
  } else {
    res.redirect("/host/rezervasyonlar");
  }
});


const Reservation = require("./models/reservation");
const Review = require("./models/review");
const { Op } = require("sequelize");

app.get('/host/profil', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user?.id;

    const user = await User.findByPk(userId);
    if (!user || user.role !== 'owner') return res.redirect('/');

    const hotels = await Hotel.findAll({ where: { user_id: userId } });
    const hotelIDs = hotels.map(h => h.id);

    const activeHotels = hotels.length;

    const totalReservations = await Reservation.count({
      where: { hotel_id: { [Op.in]: hotelIDs } }
    });

    const totalReviews = await Review.count({
      where: { hotel_id: { [Op.in]: hotelIDs } }
    });

    const totalRating = hotels.reduce((sum, hotel) => {
      return sum + (parseFloat(hotel.review_score) || 0);
    }, 0);

    const averageRating = hotels.length > 0
      ? (totalRating / hotels.length).toFixed(2)
      : "0.00";

    res.render("host/profil", {
      user,
      stats: {
        activeHotels,
        totalReservations,
        totalReviews,
        averageRating
      }
    });

  } catch (err) {
    console.error("Host profil hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});

app.get("/kiraci/profil", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user?.id;

    const user = await User.findByPk(userId);
    if (!user || user.role !== 'customer') return res.redirect('/');

    // MySQL function'ı çağır
    const [rows] = await sequelize.query("SELECT rezervasyon_ozet(:userId) AS summary", {
      replacements: { userId }
    });

    const summary = JSON.parse(rows[0].summary); // { total, confirmed, rejected }

    const totalReviews = await Review.count({ where: { user_id: userId } });

    res.render("kiraci/profil", {
      user,
      stats: {
        totalReservations: summary.total,
        confirmedReservations: summary.confirmed,
        cancelledReservations: summary.cancelled,
        totalReviews,
        pendingReservations: summary.pending, // BUNU EKLE

      }
    });
  } catch (err) {
    console.error("Kiracı profil hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});

app.get("/profil", (req, res) => {
  const role = req.session.user?.role;

  if (role === "owner") {
    res.redirect("/host/profil");
  } else if (role === "customer") {
    res.redirect("/kiraci/profil");
  } else {
    res.redirect("/admin"); // veya login'e yönlendirme de olur
  }
});





app.get('/login', (req, res) => {
  res.render('login', { error_msg: null });
});



app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.use('/hotel', hotelsRoute); // ➕ bu satırı ekle


app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/admin", (req,res)=>{
    res.render("admin/adminPanel")
})



app.get("/", async (req, res) => {
  try {
    const bestHotels = await Hotel.findAll({
      order: [["review_score", "DESC"]],
      limit: 3,
      include: [HotelImage]
    });

    res.render("index", { bestHotels }); // index.ejs'e gönder
  } catch (err) {
    console.error("Hata:", err);
    res.status(500).send("Bir hata oluştu");
  }
});

app.get("/add-hotel",(req,res)=>{
res.render("host/add-hotel");
})