const Post = require('../models/postModel');

// 등록 된 글 가져오기
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 글쓰기 할 때 참고
// exports.createPost = async (req, res) => {
//   const post = new Post({
//     title: req.body.title,
//     content: req.body.content
//   });
//   try {
//     const newPost = await post.save();
//     res.status(201).json(newPost);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };
