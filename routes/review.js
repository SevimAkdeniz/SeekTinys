const express = require('express');
const router = express.Router();
const Review = require('../models/review');
const { Hotel, User, sequelize } = require('../models'); // ✅ dikkat

router.post('/add', async (req, res) => {
    const { hotel_id, rating, comment } = req.body;
    const user_id = req.session.user.id;

    await Review.create({ user_id, hotel_id, rating, comment });

    const result = await Review.findAll({
        where: { hotel_id },
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgScore']],
        raw: true
    });

    const avgScore = parseFloat(result[0].avgScore).toFixed(1);

    await Hotel.update(
        { review_score: avgScore },
        { where: { id: hotel_id } }
    );

    res.redirect(`/kiraci/hotels/${hotel_id}`);
});

module.exports = router;
