

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  currentUserId: null,
  recipientId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setCurrentUserId: (state, action) => {
      state.currentUserId = action.payload;
    },
    setRecipientId: (state, action) => {
      state.recipientId = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
  },
});

export const { setMessages, setCurrentUserId, setRecipientId, addMessage } = chatSlice.actions;

export default chatSlice.reducer;