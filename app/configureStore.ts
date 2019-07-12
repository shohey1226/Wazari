import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";
import reducer from "./reducers/index";
import * as storage from "redux-storage";
import createEngine from "redux-storage-engine-reactnativeasyncstorage";

const engine = createEngine("Wazari");
const storageMiddleware = storage.createMiddleware(engine);

let createStoreWithMiddleware;
if (!__DEV__) {
  // production
  createStoreWithMiddleware = applyMiddleware(
    thunkMiddleware,
    storageMiddleware
  )(createStore);

} else {
  // To deal with immutable to chrome console
  const loggerMiddleware = createLogger({
    collapsed: true,
    stateTransformer: state => state.toJS()    
    // stateTransformer: state => {
    //   let newState = {};

    //   for (var i of Object.keys(state)) {
    //     if (Iterable.isIterable(state[i])) {
    //       newState[i] = state[i].toJS();
    //     } else {
    //       newState[i] = state[i];
    //     }
    //   }
    //   return newState;
    // }
  });

  createStoreWithMiddleware = applyMiddleware(
    thunkMiddleware,
    storageMiddleware,
    loggerMiddleware
  )(createStore);
}

export default function configureStore(initialState) {
  return createStoreWithMiddleware(reducer, initialState);
}
