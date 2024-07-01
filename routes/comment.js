const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");

// 웹토큰 시크릿 키
const jwtSecret = process.env.JWT_SECRET

// 몽구스 모델 호출
const Comment = require('../models/commentsModel')
const Post = require('../models/postModel')

// ---- 댓글 입력
router.post('/cmntAdd', async (req, res) => {
  const { content, postId } = req.body
  console.log('댓글입력', content, postId);

  const { token } = req.cookies
  jwt.verify(token, jwtSecret, {}, async (err, userInfo) => {
    if (err) throw err;
    console.log(userInfo);

    try {
      const cmntDoc = await Comment.create({
        postId,
        userId: userInfo.userid,
        username: userInfo.username,
        content
      })
      const countCmnt = await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
      res.json({ cmntDoc, countCmnt, msg: 'ok' })

    } catch (error) {
      console.error('댓글 입력 서버 에러', error);
      res.status(500).json('댓글 작성 서버 에러', error);
    }
  })
})

// ---- 댓글 데이터 받아서 전송
router.get('/cmntList/:postId', async (req, res) => {
  const { postId } = req.params
  try {
    const cmntList = await Comment.find({ postId }).sort({ createdAt: -1 })
    // console.log(cmntList);
    res.json(cmntList)

  } catch (error) {
    console.error('댓글 데이터 전송 실패', error);
    res.status(500).json('댓글 데이터 전송 서버 에러', error);
  }
})

// ---- 댓글 삭제
router.delete('/cmntDel/:postId/:cmntId', async (req, res) => {
  const { cmntId, postId } = req.params
  console.log(cmntId, '/', postId);
  try {
    const cmntDel = await Comment.findByIdAndDelete(cmntId);
    const minusCmntCount = await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } });
    res.json({ cmntDel, minusCmntCount, msg: 'ok' })

  } catch (error) {
    console.error('댓글 삭제 에러', error);
    res.status(500).json('댓글 삭제 서버 에러', error);
  }
})

// ---- 댓글 수정
router.put('/cmntUpdate/:cmntId', async (req, res) => {
  const { cmntId } = req.params;
  const { comment } = req.body;
  console.log(cmntId, comment);
  try {
    await Comment.findByIdAndUpdate(cmntId, { content: comment });
    res.json({ message: 'ok' })
  } catch (error) {
    console.error(error);
    res.status(500).json('댓글 수정 서버 에러', error);
  }
})

module.exports = router;