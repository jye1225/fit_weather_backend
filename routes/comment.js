const express = require('express');
const router = express.Router();

// ---- 댓글 입력

// 댓글 쓰기,화면에 출력, 삭제, 수정 기능
// 댓글 쓰기
// app.post('/commentAdd', async (req, res) => {
//   const { content, postId } = req.body
//   const { token } = req.cookies;
//   jwt.verify(token, jwtSecret, {}, async (err, info) => {
//     if (err) throw err
//     const commentDoc = await Comment.create({
//       content,
//       author: info.username,
//       postId,
//     })
//     // console.log(commentDoc);
//     res.json(commentDoc)
//   })
// })

// 댓글 쓰기 : formData로 정보를 받아서 댓글을 쓸 때
// app.post('/commentAdd', upload.none(), async (req, res) => {
//   const { token } = req.cookies;
//   if (!token) {
//     return res.status(402).json({ message: '인증토큰 없음' })
//   }
//   jwt.verify(token, jwtSecret, {}, (err, info) => {
//     if (err) throw err
//     const { content, postId } = req.body
//     const commentDoc = Comment.create({
//       content,
//       postId,
//       author: info.username,
//     })
//     res.json(commentDoc)
//   })
// })

// // 댓글 출력
// app.get('/commentList/:postId', async (req, res) => {
//   const { postId } = req.params
//   const commentList = await Comment.find({ postId }).sort({ createdAt: -1 })
//   res.json(commentList)
// })

// // 댓글 삭제
// app.delete('/deleteCmnt/:cmntId', async (req, res) => {
//   const { cmntId } = req.params
//   console.log(cmntId);
//   await Comment.findByIdAndDelete(cmntId)
//   res.json({ message: 'ok' })
// })

// // 댓글 수정
// app.put('/updateComment/:cmntId', async (req, res) => {
//   const { cmntId } = req.params;
//   const { content } = req.body;
//   await Comment.findByIdAndUpdate(cmntId, { content });
//   res.json({ message: 'complite' })
// })

module.exports = router;