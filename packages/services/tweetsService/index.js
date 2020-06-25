import { createSlice } from '@reduxjs/toolkit';
import * as selectors from './selectors';

const tweetsService = createSlice({
  name: 'tweets',
  initialState: {
    tweets: [],
    page: ''
  },
  reducers: {
    getTweets: () => {},
    setTweets: (state, action) => {
      state.tweets = action.payload
    },
  },
});

const { actions, reducer } = tweetsService;

export  { actions as tweetsActions }
export { reducer as tweetsServiceReducer }
export { selectors as tweetsSelectors }
