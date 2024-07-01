const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema({
  postId: { type: String, required: true },
  userId: {
    type: String, //required: true 
  },
  username: { type: String, },
  content: { type: String, required: true },
},
  { timestamps: true }
);

const CommentModel = mongoose.model('Comment', CommentSchema, 'comments');
module.exports = CommentModel