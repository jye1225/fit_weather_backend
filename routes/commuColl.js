const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// 웹토큰 시크릿 키
const jwtSecret = process.env.JWT_SECRET;

// 몽구스 모델 호출
const Post = require('../models/postModel')
const Like = require('../models/likeModel');
const Comment = require('../models/commentsModel')

// 작성글 get 요청
router.get('/talk', async (req, res) => {
  // const { userId } = req.query
  const { token } = req.cookies;
  console.log('토큰', token);
  jwt.verify(token, jwtSecret, {}, async (err, userInfo) => {
    if (err) throw err;
    try {
      const userId = userInfo.userid
      console.log("유저정보", userId, "/", userInfo.username);
      const talkPostList = await Post.find({ userId }).sort({ createdAt: -1 });
      // console.log(talkPostList);
      res.json(talkPostList)

    } catch (error) {
      console.error(error);
      res.status(500).json("작성글 get 요청 서버 에러", { error });
    }
  })
})

// 작성댓글 get요청
router.get('/comments', async (req, res) => {
  const { token } = req.cookies;
  console.log('토큰', token);
  jwt.verify(token, jwtSecret, {}, async (err, userInfo) => {
    if (err) throw err;
    try {
      const userId = userInfo.userid
      console.log("유저정보", userId, "/", userInfo.username);
      const commnetsList = await Comment.find({ userId }).sort({ createdAt: -1 });
      console.log(commnetsList);
      res.json(commnetsList)

    } catch (error) {
      console.error(error);
      res.status(500).json("작성댓글 get 요청 서버 에러", { error });
    }
  })
})

// 좋아요 리스트 get요청
router.get('/likes', async (req, res) => {
  const { token } = req.cookies;
  console.log('토큰', token);
  jwt.verify(token, jwtSecret, {}, async (err, userInfo) => {
    if (err) throw err;
    try {
      const userId = userInfo.userid
      console.log("유저정보", userId, "/", userInfo.username);
      const LikeList = await Like.find({ userId })
      if (LikeList.length === 0) {
        // LikeList가 비어 있는 경우 빈 배열 반환
        return res.json([]);
      }

      const postIds = LikeList[0].postId

      // posts 컬렉션에서 해당 postId와 일치하는 게시물들 찾기
      const posts = await Promise.all(postIds.map(async (postId) => {
        return await Post.findById(postId);
      }))
      const sortedPosts = posts.sort((a, b) => b.createdAt - a.createdAt);
      res.json(sortedPosts)


    } catch (error) {
      console.error(error);
      res.status(500).json("작성댓글 get 요청 서버 에러", { error });
    }
  })
})



module.exports = router;