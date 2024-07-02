const mongoose = require('mongoose');
const { Schema } = mongoose;

const LikeSchema = new Schema({
  postId: { type: [String] },
  userId: String
});

const LikeModel = mongoose.model('Like', LikeSchema, 'likes');
module.exports = LikeModel
