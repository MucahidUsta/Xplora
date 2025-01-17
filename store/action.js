export const ADD_PHOTO = 'ADD_PHOTO';
export const SET_FOLLOWING = 'SET_FOLLOWING';

export const addPhoto = (photo) => ({
  type: ADD_PHOTO,
  payload: photo,
});

export const setFollowing = (following) => ({
  type: SET_FOLLOWING,
  payload: following,
});