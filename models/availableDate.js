const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AvailableDate = sequelize.define('AvailableDate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  hotel_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'AvailableDates',
  timestamps: true
});

module.exports = AvailableDate;
