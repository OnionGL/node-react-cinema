import {Routes, useLocation , Route} from 'react-router-dom';
import Headers from './Components/Headers/Headers'
import CinemaById from './Components/CinemaById/CinemaById';
import Cinema from './Components/Cinema/Cinema';
import SearchByKeyword from './Components/SearchByKeyword/SearchByKeyword';
import { useTransition, animated } from 'react-spring'
import SearchByFilter from './Components/SearchByFilter/SearchByFilter';
import React , {useEffect} from 'react';
import Footer from './Components/Footer/Footer';
import {useAuthState} from 'react-firebase-hooks/auth'
import {authentication} from './API/Firebase'
import Login from './Components/Login/Login';
import { getUserList, loginUser, setUser } from './MongoAPI/mongoDB';
import { useDispatch } from 'react-redux';



const App = () => {
  const dispatch = useDispatch()
  const [user] = useAuthState(authentication)
  const location = useLocation()

  const loginSuccess = (userId , token) => ({
    type: 'LOGIN_SUCCESS',
    payload: { userId },
  });

  useEffect(() => {
    if(localStorage.getItem('user')){
      dispatch(loginSuccess(localStorage.getItem('user')))
    }
  } , [])

  const transitions = useTransition(location , {
    from : {
      opacity : 0,
    },
    enter : {
      opacity : 1,
    },
    leave : {
      opacity : 0,
    },
    delay: 200,
  }
  );
  return <>
  {
    <>
    <Headers />
    <div className="main__app">
      {transitions((props , item) => (
        <animated.div style={props}>
          <div className= "main__app__switch">
          <Routes>
              <Route exact path='/cinema' element = {<Cinema />}></Route>
              <Route exact path='/' element = {<Cinema />}></Route>
              <Route exact path='/cinema/:value' element = {<SearchByKeyword />}></Route>
              <Route exact path='/cinemaByFilter/:ratingfrom/:ratingto/:yearfrom/:yearto/:genre/:order' element = {<SearchByFilter />}></Route>
              <Route exact path='/cinemainfo/:id' element = {<CinemaById />}></Route>
              <Route exact path='/login' element={<Login />}></Route>
              <Route exact path='/recommendations/you' element = {<Cinema cinemaPage={5} />}></Route>
              <Route exact path='/recommendations/people' element = {<Cinema cinemaPage={8} />}></Route>
            </Routes>
          </div>
        </animated.div>
      ))}
      <Footer />
      </div>
    </>
    
  }
                 
  </>;
}

export default App;
