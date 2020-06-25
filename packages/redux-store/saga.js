import tweetsSaga from "@template/services/tweetsService/saga";
import { all, fork } from "redux-saga/effects";

export default function* sagas() {
  yield all(
    [
      tweetsSaga,
    ].map(saga => fork(saga))
  )
}
