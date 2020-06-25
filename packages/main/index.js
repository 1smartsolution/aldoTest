import store from "@template/redux-store";
import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import Tweets from '@template/layouts/screens/tweets';

const testStore = store();

render(
  <Provider store={testStore}>
      <Tweets/>
  </Provider>,
  document.getElementById("root")
)