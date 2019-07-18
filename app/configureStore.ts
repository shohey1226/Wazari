import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";
import reducer from "./reducers/index";
import { isCollection } from "immutable";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-community/async-storage";
import immutableTransform from "redux-persist-transform-immutable";

const persistConfig = {
  key: "root",
  transforms: [immutableTransform()],
  storage: AsyncStorage
};
const persistedReducer = persistReducer(persistConfig, reducer);

let createStoreWithMiddleware;
if (!__DEV__) {
  // production
  createStoreWithMiddleware = applyMiddleware(thunkMiddleware)(createStore);
} else {
  // To deal with immutable to chrome console
  const loggerMiddleware = createLogger({
    collapsed: true,
    //    stateTransformer: state => state.toJS()
    stateTransformer: state => {
      let newState = {};

      for (var i of Object.keys(state)) {
        if (isCollection(state[i])) {
          newState[i] = state[i].toJS();
        } else {
          newState[i] = state[i];
        }
      }
      return newState;
    }
  });

  createStoreWithMiddleware = applyMiddleware(
    thunkMiddleware,
    loggerMiddleware
  )(createStore);
}

export default function configureStore(initialState) {
  const store = createStoreWithMiddleware(persistedReducer, initialState);
  return { store, persistor: persistStore(store) };
}
