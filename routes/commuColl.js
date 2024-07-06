const express = require("express");
const router = express.Router();

// 몽구스 모델 호출
const Post = require('../models/postModel')
const Like = require('../models/likeModel');
const Comment = require('../models/commentsModel')

// 작성글 get 요청
router.get('/talk/:userId', async (req, res) => {
  const { userId } = req.params
  const page = Math.max(1, parseInt(req.query.page)) || 1;
  console.log('페이지', page);
  console.log('작성글 요청 유저아이디:', userId);

  try {
    const limit = 8;
    const skip = (page - 1) * limit;
    const talkPostList = await Post.find({ userId }).sort({ createdAt: -1 })
      .skip(skip).limit(limit);
    // 특정 사용자의 총 게시물 수 계산
    const totalPosts = await Post.countDocuments({ userId });
    const totalPages = Math.ceil(totalPosts / limit)

    console.log('내가쓴 글 수', totalPosts);
    console.log('총 페이지 수', totalPages);
    // console.log(talkPostList);
    res.json({ talkPostList, page, totalPages, totalPosts })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "작성글 get 요청 서버 에러", error });
  }
})


// 작성댓글 get요청
router.get('/comments/:userId', async (req, res) => {
  const { userId } = req.params
  const page = parseInt(req.query.page) || 1;

  try {
    const limit = 8;
    const skip = (page - 1) * limit;
    const commentsList = await Comment.find({ userId }).sort({ createdAt: -1 })
      .skip(skip).limit(limit);
    const totalCmnts = await Comment.countDocuments({ userId });
    const totalPages = Math.ceil(totalCmnts / limit)
    console.log('내가쓴 댓글 수', totalCmnts);
    console.log('총 페이지 수', totalPages);
    res.json({ commentsList, totalCmnts, totalPages, page })

  } catch (error) {
    console.error(error);
    res.status(500).json("작성댓글 get 요청 서버 에러", { error });
  }
})

// 좋아요 리스트 get요청
router.get('/likes/:userId', async (req, res) => {
  const { userId } = req.params
  const page = parseInt(req.query.page) || 1;

  try {
    const limit = 8;
    const skip = (page - 1) * limit;
    const LikeList = await Like.find({ userId })
    if (LikeList.length === 0) {
      // LikeList가 비어 있는 경우 빈 배열 반환
      return res.json([]);
    }

    const postIds = LikeList[0].postId
    // 여기서 페이지네이션 적용
    const paginatedPostIds = postIds.slice(skip, skip + limit);
    // posts 컬렉션에서 해당 postId와 일치하는 게시물들 찾기
    const posts = await Promise.all(paginatedPostIds.map(async (postId) => {
      return await Post.findById(postId);
    }))
    const sortedPosts = posts.sort((a, b) => b.createdAt - a.createdAt)

    const totalLikes = postIds.length;
    const totalPages = Math.ceil(totalLikes / limit)
    console.log('내가 좋아요 한 글 수', totalLikes);
    console.log('총 페이지 수', totalPages);

    res.json({ sortedPosts, page, totalLikes, totalPages })
  } catch (error) {
    console.error(error);
    res.status(500).json("작성댓글 get 요청 서버 에러", { error });
  }
})



module.exports = router;