import { createSelector } from '@reduxjs/toolkit';

const tweets = state => state.tweetsServiceReducer.tweets;

export const tweetsSelector = createSelector(
  tweets,
  items => items
);
