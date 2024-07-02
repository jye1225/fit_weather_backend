const mongoose = require('mongoose');
const { Schema } = mongoose;

const CoordiReviewSchema = new Schema({
  postId: String,
  userId: String,
  btnType: String,
});

const CoordiReviewModel = mongoose.model('CoordiReview', CoordiReviewSchema);
module.exports = CoordiReviewModel
