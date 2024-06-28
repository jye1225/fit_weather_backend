const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require('path');

// 포스트 이미지 저장 경로 multer 설정
const postImgUpload = multer.diskStorage({
  destination: 'codiUploads/postImg/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
const postImgUp = multer({ storage: postImgUpload })

// 몽구스 모델 호출
const Post = require('../models/postModel')

// ---- 커뮤니티 디테일 페이지
router.get('/postDetail/:postId', async (req, res) => {
  try {
    const { postId } = req.params
    const detailData = await Post.findById(postId)
    // console.log(detailData);
    res.json(detailData)
  } catch (error) {
    console.error('디테일 데이터 에러', error);
    res.status(500).json({ message: "디테일DB관련 서버 에러 발생" });
  }
})

// ---- 글 가져오기 get요청
router.get('/getAllPosts', async (req, res) => {
  try {
    // const page = parseInt(req.query.page) || 1;
    // const limit = page === 1 ? 10 : 5;  // 첫 페이지는 5개, 나머지는 5개
    // const skip = page === 1 ? 0 : 5 + (page - 2) * 5;  // 첫 페이지 이후 스킵 계산

    const postsList = await Post.find().sort({ createdAt: -1 })
    // .skip(skip).limit(limit)
    const total = await Post.countDocuments();

    res.json({
      postsList,
      total
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "전체DB 관련 서버 에러 발생" });
  }
})

// ---- 글쓰기 post요청
router.post('/writePost', postImgUp.single('file'), async (req, res) => {
  const { postCate, onReview, title, content, region } = req.body
  const path = req.file ? req.file.path : null;
  console.log('글쓰기', postCate, region, onReview, title, content);
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
      region,
      likeCount: 0,
      commentsCount: 0,
      coordiReview: onReview,
      coordiGood: 0,
      coordiSoso: 0,
      coordiBad: 0,
    })
    res.json(postDoc)

    //로그인 된 회원정보 cookies 에서 가져오기
    // const { token } = req.cookies
    // jwt.verify(token, jwtSecret, {}, async (err, info) => {
    //   if (err) throw err;
    //   console.log(info.username);
    //   const { title, summary, content } = req.body
    //   const postDoc = await Post.create({
    //     title,
    //     summary,
    //     content,
    //     cover: newPath,
    //     author: info.username,
    //   })
    //   res.json(postDoc)
    // })

  } catch (err) {
    console.error(err);//백 터미널 출력
    res.status(500).json({ err });//프론 콘솔 출력
  }
})

// 좋아요 클릭 ----
const Like = require('../models/likeModel')
router.post('/like', async (req, res) => {
  console.log(req.body);
  try {
    const { postId, isLike } = req.body;
    console.log(isLike);
    const increment = isLike ? 1 : -1;
    await Post.findByIdAndUpdate(postId, { $inc: { likeCount: increment } })


    res.json({ success: true })
  } catch (error) {
    console.error(error);
  }

})

module.exports = router;