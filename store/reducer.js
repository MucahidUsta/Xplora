import { ADD_PHOTO, SET_FOLLOWING } from './action';
import { createSlice } from '@reduxjs/toolkit';
const initialState = {
  photos: [],
  following: [],
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_PHOTO:
      return {
        ...state,
        photos: [...state.photos, action.payload],
      };
    case SET_FOLLOWING:
      return {
        ...state,
        following: action.payload,
      };
    default:
      return state;
  }
};

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    currentUserId: null,
    recipientId: null,
    messages: [],
  },
  reducers: {
    setCurrentUserId: (state, action) => {
      state.currentUserId = action.payload;
    },
    setRecipientId: (state, action) => {
      state.recipientId = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
  },
});

export const { setCurrentUserId, setRecipientId, setMessages, addMessage } = chatSlice.actions;


export default userReducer;