//일단 시도해보고 있는 중

// const express = require('express');
// const router = express.Router();

// const INSTA_ACCESS_TOKEN = 'EABwxhKkQmXQBO9ZAoxICMZACewWi9ec5G3zmhGgEqHiSadtq0XSgPCNX6OE5Xk5lghqaPcHH6CS8EPaxE9deCtIy4jXAFqw7U6xFZBTm4aSUg2zYTT6kiMhgGqeWhKMu2nZAHMtjOYMnYKBcc9MfSRGGaS6kyyiXF8tcDMTD5U6YZAw7BAGjMbAtdSx76AtFa'
// router.get('/getFeeds', async (req, res) => {
//   try {
//     const response = await fetch(`https://graph.instagram.com/v20.0/7935745189779828?fields=business_discovery.username(seoziyeon){media}&access_token=EABwxhKkQmXQBO0RJVf4pCtWv5lJin4J7kIkP2arg2rZAZBNftLGjJHH99bc8GLERCpcs5h1f7ZC6fKYZAH7sVaKO8QPRtMZBMcbsXWx7ZBeLr7vw9xLFJOKdI0ct7b1Qnv2XJ0IbEaZCGUrgDTPpyhtR2v8PeTyJsZAVOrHZBdUk3sh8DcZAl8DYw4ZAZAPL3RXVyzn0`)
//     const textResponse = await response.text();
//     // console.log(response);
//     console.log('Raw response:', textResponse);
//     // let data

//     // res.json(data)
//   } catch (error) {
//     console.error('인스타 피드 요청 서버 에러', error);
//     res.status(500).json('인스타 피드 요청 서버 에버', error);
//   }
// })
// module.exports = router;