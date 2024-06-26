const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require('path');


// 몽구스 모델 호출
const Post = require('../models/postModel')

// 포스트 이미지 저장 경로 multer 설정
const postImgUpload = multer.diskStorage({
  destination: 'codiUploads/postImg/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
const postImgUp = multer({ storage: postImgUpload })

// ---- 글 가져오기 get요청
router.get('/getAllPosts', async (req, res) => {
  try {
    const postsList = await Post.find().sort({ createdAt: -1 })
    console.log(postsList);
    res.json(postsList)

  } catch (err) {
    console.error(err);
  }
})

// ---- 글쓰기 post요청
router.post('/writePost', postImgUp.single('file'), async (req, res) => {
  const { postCate, onReview, title, content } = req.body
  const path = req.file ? req.file.path : null;
  console.log('글쓰기', postCate, onReview, title, content);
  console.log('이미지 경로', path);

  //회원가입 로그인 기능 구현외면 userId, username 하기
  //token,cookies에서 받아와서?
  try {
    const postDoc = await Post.create({
      userId: Math.random() * 10, //로그인 기능 생기면 바꾸기
      username: null,
      category: postCate,
      title,
      content,
      image: path,
      region: '대구광역시',
      likeCount: 0,
      commentsCount: 0,
      coordiReview: onReview,
      coordiGood: 0,
      coordiSoso: 0,
      coordiBad: 0,
    })
    res.json(postDoc)
  } catch (err) {
    console.error(err);//백 터미널 출력
    res.status(500).json({ err });//프론 콘솔 출력
  }

})


module.exports = router;