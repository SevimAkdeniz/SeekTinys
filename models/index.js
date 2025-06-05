const User = require('./users');
const Hotel = require('./hotels');
const Reservation = require('./reservation');
const HotelImage = require('./hotelImage');
const Review = require('./review');

Hotel.hasMany(Review, { foreignKey: 'hotel_id' });
User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(Hotel, { foreignKey: 'hotel_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });

// İlişkileri burada tanımla
Hotel.hasMany(HotelImage, { foreignKey: 'hotel_id' });
HotelImage.belongsTo(Hotel, { foreignKey: 'hotel_id' });

Hotel.hasMany(Reservation, { foreignKey: 'hotel_id' });
Reservation.belongsTo(Hotel, { foreignKey: 'hotel_id' });

User.hasMany(Reservation, { foreignKey: 'user_id' });
Reservation.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  User,
  Hotel,
  Reservation,
  HotelImage,
  Review
};
