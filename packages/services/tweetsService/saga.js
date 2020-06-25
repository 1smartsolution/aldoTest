import { call, put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
import { tweetsActions } from '.';

const callBackend = ({page}) => {
  return page === 'dtTweets'
    ? axios.get(`http://servicesNode.1smartsolution.com/testAPI?type=tweets&user=realDonaldTrump`)
    : axios.get(`http://servicesNode.1smartsolution.com/testAPI?type=tweets&user=hillaryClinton`);
}

export function* watchGetTweets({payload}) {
  const result = yield callBackend(payload);
  yield put(tweetsActions.setTweets(result.data));
}

export default function* rootSaga() {
  yield takeLatest('tweets/getTweets', watchGetTweets);
}
