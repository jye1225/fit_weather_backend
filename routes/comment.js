const express = require('express');
const router = express.Router();

// 몽구스 모델 호출
const Comment = require('../models/commentsModel')
const Post = require('../models/postModel')

module.exports = function (User) {
  const router = express.Router();

  // ---- 댓글 입력
  router.post('/cmntAdd', async (req, res) => {
    const { content, postId, userId, username } = req.body
    console.log('댓글입력:', content, postId, userId, username);

    try {
      const cmntDoc = await Comment.create({
        postId,
        userId,
        username,
        content
      })
      const countCmnt = await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
      res.json({ cmntDoc, countCmnt, msg: 'ok' })

    } catch (error) {
      console.error('댓글 입력 서버 에러', error);
      res.status(500).json('댓글 작성 서버 에러', error);
    }
  })


  // ---- 댓글 데이터 받아서 전송
  router.get('/cmntList/:postId', async (req, res) => {
    const { postId } = req.params;
    try {
      const cmntList = await Comment.find({ postId }).sort({ createdAt: -1 })
      // console.log(cmntList);
      if (cmntList.length === 0) {
        return res.json([])
      }

      const userIds = cmntList.map(comment => comment.userId);
      const userInfos = await User.find({ userid: { $in: userIds } });

      // userInfos 배열을 userId를 키로 하는 객체로 변환합니다.
      const userInfoMap = userInfos.reduce((acc, userInfo) => {
        acc[userInfo.userid] = userInfo;
        return acc;
      }, {});

      console.log('userInfos', userInfos);
      console.log('userInfoMap', userInfoMap);

      // 각 댓글 객체에 userProfileImg를 추가합니다.
      const cmntListWithProfileImgs = cmntList.map(comment => {
        const user = userInfoMap[comment.userId];
        return {
          ...comment._doc, // Mongoose 문서 객체에서 순수 자바스크립트 객체로 변환
          userProfileImg: user ? user.profile_image : null,
        };
      });

      res.json({ cmntList: cmntListWithProfileImgs })

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
      res.json({ cmntDel, minusCmntCount })
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

  return router;
};