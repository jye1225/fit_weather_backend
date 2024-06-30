const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require('path');
const jwt = require("jsonwebtoken");

// 웹토큰 시크릿 키
const jwtSecret = process.env.JWT_SECRET

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
const Like = require('../models/likeModel');

// ---- 커뮤니티 디테일 페이지 정보 get요청
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
    //무한스크롤용인데...
    // const page = parseInt(req.query.page) || 1;
    // const limit = page === 1 ? 15 : 5;  // 첫 페이지는 5개, 나머지는 5개
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
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userInfo) => {
    if (err) throw err;
    console.log('유저정보', userInfo.userid, '/', userInfo.username);
    try {
      const postDoc = await Post.create({
        userId: userInfo.userid,
        username: userInfo.username,
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
    } catch (err) {
      console.error(err);
      res.status(500).json({ err: '글쓰기 서버 에러' });
    }
  })

})

// ---- 좋아요 클릭 
router.post('/like', async (req, res) => {
  console.log(req.body);
  try {
    const { postId, isLike } = req.body;
    console.log(isLike);
    const updateLikeCoun = await Post.findByIdAndUpdate(postId, { $inc: { likeCount: isLike ? 1 : -1 } })
    res.json({ success: true, likes: updateLikeCoun.likeCount })

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: '좋아요 서버 에러' });
  }

})

// ---- 코디 리뷰 클릭
router.put('/updateReview/:postId', async (req, res) => {
  console.log(req.body)
  console.log(req.params)
  const { postId } = req.params
  const { btnType, count } = req.body

  const updateField = `coordi${btnType}`
  const updateCount = count === 'increment' ? 1 : -1;

  try {
    const updateReview = await Post.findByIdAndUpdate(postId, { $inc: { [updateField]: updateCount } })
    console.log(updateReview);
    res.json(updateReview)
  } catch (error) {
    console.error('코디 리뷰 서버 에서', error);
  }

})

// ---- 글 삭제
router.delete('/delPost/:postId', async (req, res) => {
  try {
    const { postId } = req.params
    console.log(postId);
    await Post.findByIdAndDelete(postId)
    res.json({ msg: 'ok' })

  } catch (error) {
    console.error('포스트 삭제 실패', error);
    res.status(500).json({ error: '포스트 삭제 서버 에러' });
  }
})

// ---- 글 수정
// 수정페이지용 데이터 요청
router.get('/postEdit/:postId', async (req, res) => {
  try {
    const { postId } = req.params
    console.log(postId);
    const postDoc = await Post.findById(postId)
    res.json(postDoc)

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '수정 페이지로 이동시 데이터 서버 에러' });
  }
})

// 수정한 데이터 전송(디테일페이지 수정요청 기능)
router.put('/postUpdate/:postId', postImgUp.single('file'), async (req, res) => {
  const { postId } = req.params
  const { postCate, onReview, title, content, region, originImgPath } = req.body
  let path = req.file ? req.file.path : null;
  console.log('글수정-----', postId, postCate, region, onReview, title, content);
  console.log('원래 이미 경로', originImgPath);
  console.log('이미지 경로', path);

  if (!path && originImgPath) {
    // 새로운 파일이 없고 원래 이미지 있을 때
    path = originImgPath;
    console.log('변경된 경로', path);
  }

  try {
    const postDoc = await Post.findByIdAndUpdate(postId, {
      category: postCate,
      title,
      content,
      image: path,
      region,
      coordiReview: onReview,
    })
    res.json(postDoc)
  } catch (err) {
    console.error('글수정 업데이트 서버 에러', err);
  }
})


module.exports = router;