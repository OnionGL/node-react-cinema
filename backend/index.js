const express = require('express');
const cors = require('cors');
const mongoDBConnect = require('./db');
const mongoose = require('mongoose');
const User = require('./models/userModels'); 
const Comment = require('./models/commentModels')
const {loginUser ,registerUser , checkAuthController} = require('./controller/loginController')
const {checkAuth} = require('./utils/checkAuth');
const authValidation = require('./validations/authValidators');


const PORT = 8080;
const app = express();

app.use(cors());
app.use(express.json());

const start = async () => {
   try {
      app.listen(PORT, () => console.log(`server started pn port ${PORT}`));
      mongoDBConnect()
   } catch (e) {
      console.log(e);
   }
}


app.post('/user' , async (req , res) => {
   if(!req.body.data) res.json({message: 'нет данных'})
   const newUser = {
      fullName: req.body.data.displayName,
      email: req.body.data.email,
      longitube: 12.31233321,
      latitube: 12.312312,
      listSelectedFilms: [],
      googleId: req.body.data.uid
   }
   const user = new User(newUser)
   const isAlredy = await User.findOne({googleId: req.body.data.uuid})
   if(isAlredy){
      return res.json({message: "Авторизация прошла успешно"})
   }
   user.save()
   return res.json({message: "Пользователь добавлен"})
})

app.get('/userList' , async (req , res) => {
   const users = await User.find()
   return res.json(users)
})

app.patch('/userUpdate' , async (req , res) => {
   const findUser = await User.find({googleId: 1})
   const update = {$set: {listSelectedFilms: [...findUser[0].listSelectedFilms , 2]}}
   await User.updateOne({googleId: 1} , update)
   res.json({message: "Обновление прошло успешно"})
})


app.post('/login' , loginUser)

app.post('/register' , authValidation , registerUser)

app.get('/me' , checkAuth , checkAuthController)

app.post('/comment' , async (req , res) => {
   const findComment = await Comment.find({idCinema: req.body.cinemaId})
   if(findComment.length){
      const update = {$set: {listComment: [...findComment[0].listComment , req.body.comment]}}
      await Comment.updateOne({idCinema: req.body.cinemaId} , update)
      return res.json({message: "Комментарий добавлен"})
   } else {
      const newComment = {
         idCinema: req.body.cinemaId,
         comment: [req.body.comment]
      }
      const comment = new Comment(newComment)
      comment.save()
      return res.json({message: "Комментарий добавлен"})
   }
})

app.get('/comment/:id' , async (req , res) => {
   const findComment = await Comment.findOne({idCinema: req.params.id})
   if(findComment){
      return res.json({comment: findComment.listComment})
   }
   return res.json({comment: []})
})

app.post('/rating' , async (req , res) => {
   const findUser = await User.findOne({_id: req.body.userId})
   if(findUser.rating.find(i => i?.movieId == req.body.idCinema)){
      const update = {
         $set: { "rating.$[elem].rating": parseInt(req.body.rating) }
      };
   
      const options = {
         arrayFilters: [
            { "elem.movieId": req.body.idCinema }
         ]
      };
      await User.updateOne({_id: req.body.userId} , update , options)
      return res.json({message: 'Рейтинг обновлен'})
   }
   const update = {$set: {rating: [...findUser.rating , {rating: parseInt(req.body.rating) , movieId: req.body.idCinema}]}}
   await User.updateOne({_id: req.body.userId} , update)
   return res.json({message: 'Рейтинг обновлен'})
})

app.get('/rating/:userId/:idCinema' , async (req , res) => {
   const userId = req.params.userId;
   const movieId = req.params.idCinema;

   if(req.params.userId){
      const user = await User.findOne({
         _id: userId,
         rating: { $elemMatch: { movieId: movieId } }
      });
   
      if (!user) {
         return res.status(404).json({ message: 'Пользователь или фильм не найдены' });
      }
      // Найден пользователь с указанным userId и рейтингом для указанного movieId
      const rating = user.rating.find(item => item.movieId === movieId);
      return res.json({ rating: rating.rating });
   }

})

app.get('/allRating/:idCinema' , async (req , res) => {
   const movieId = req.params.idCinema;

   const ratings = await User.aggregate([
      { $match: { 'rating.movieId': movieId } }, // Найти документы, где movieId совпадает
      { $unwind: '$rating' }, // Развернуть массив rating
      { $match: { 'rating.movieId': movieId } }, // Найти документы, где movieId совпадает
      { $group: { _id: null, averageRating: { $avg: '$rating.rating' } } } // Вычислить среднее значение рейтинга
   ]);

   if (ratings.length === 0) {
      return res.status(404).json({ message: 'Рейтинги для фильма не найдены' });
   }
   const averageRating = ratings[0].averageRating;
   return res.json({ averageRating });
})

start();


