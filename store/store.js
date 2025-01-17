import { configureStore } from '@reduxjs/toolkit';
import userReducer from './reducer';
import chatReducer from '../store/chatSlice';
import placesReducer from '../store/placesSlice';


const store = configureStore({
  reducer: {
    user: userReducer,
    chat: chatReducer,
    
   // places: placesReducer,
  },
});

export default store;
