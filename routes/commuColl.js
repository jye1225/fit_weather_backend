const express = require("express");
const router = express.Router();

// 작성글 get 요청
router.get('/talk', async (req, res) => {
  const { userId } = req.query
  console.log(userId);
})

// 작성댓글 get요청

// 좋아요 리스트 get요청


module.exports = router;