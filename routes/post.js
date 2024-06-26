const express = require('express')
const router = express.Router();
const postController = require('../controllers/postController');

router.get('/posts', postController.getAllPosts);
// router.post('/createPost', postController.createPost);

module.exports = router;