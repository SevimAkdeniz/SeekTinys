// models/review.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./users');
const Hotel = require('./hotels');



const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  rating: {
    type: DataTypes.INTEGER, // 1-5 arası
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  hotel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'Reviews',
  timestamps: true,
});

Review.belongsTo(User, { foreignKey: 'user_id' });
Review.belongsTo(Hotel, { foreignKey: 'hotel_id' });

module.exports = Review;
