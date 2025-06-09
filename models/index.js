const User = require('./users');
const Hotel = require('./hotels');
const Reservation = require('./reservation');
const HotelImage = require('./hotelImage');
const Review = require('./review');
const Payment = require('./payments');
const AvailableDate = require('./availableDate');

// Otel -> Müsait Tarihler (1:N)
Hotel.hasMany(AvailableDate, { foreignKey: 'hotel_id' });
AvailableDate.belongsTo(Hotel, { foreignKey: 'hotel_id' });

// Otel ve Kullanıcı -> Yorumlar (1:N)
Hotel.hasMany(Review, { foreignKey: 'hotel_id' });
User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(Hotel, { foreignKey: 'hotel_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });

// Otel -> Görseller (1:N)
Hotel.hasMany(HotelImage, { foreignKey: 'hotel_id' });
HotelImage.belongsTo(Hotel, { foreignKey: 'hotel_id' });

// Otel ve Kullanıcı -> Rezervasyon (1:N)
Hotel.hasMany(Reservation, { foreignKey: 'hotel_id' });
Reservation.belongsTo(Hotel, { foreignKey: 'hotel_id' });

User.hasMany(Reservation, { foreignKey: 'user_id' });
Reservation.belongsTo(User, { foreignKey: 'user_id' });

// Rezervasyon -> Ödeme (1:1)
Reservation.hasOne(Payment, { foreignKey: 'reservation_id' });
Payment.belongsTo(Reservation, { foreignKey: 'reservation_id' });

module.exports = {
  User,
  Hotel,
  Reservation,
  HotelImage,
  Review,
  Payment,
  AvailableDate
};
