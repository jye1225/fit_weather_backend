const mongoose = require('mongoose');
const { Schema } = mongoose

const PostSchema = new Schema({
  userId: { type: String, required: true },
  username: { type: String },
  category: String,
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, default: null },
  region: { type: String, required: true },
  likeCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  coordiReview: { type: Boolean, default: 'no' },
  coordiGood: { type: Number, default: 0 },
  coordiSoso: { type: Number, default: 0 },
  coordiBad: { type: Number, default: 0 },
},
  { timestamps: true }
)

const PostModel = mongoose.model('Post', PostSchema, 'posts')
module.exports = PostModel