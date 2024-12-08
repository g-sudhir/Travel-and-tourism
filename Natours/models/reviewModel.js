const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review must contain a comment'],
        minlength: [5, 'Review must have more or equal then 5 characters'],
        maxlength: [500, 'Review must have less or equal then 500 characters']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Review must have a rating between 1 and 5']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;