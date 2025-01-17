import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUser: null,
  following: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    setFollowing: (state, action) => {
      state.following = action.payload;
    },
  },
});

export const { setCurrentUser, setFollowing } = userSlice.actions;

export default userSlice.reducer;