// Copyright 2016 Manuel Braun (mb@w69b.com). All Rights Reserved.
// License: http://www.apache.org/licenses/LICENSE-2.0
import {redux, reduxPromise, reduxLogger, reduxThunk, PolymerRedux} from '../../npm-imports.js';
import * as actions from './actions/index.js';
import reducers from './reducers/index.js';



// const logger = reduxLogger();
let store = redux.createStore(reducers,
  redux.compose(redux.applyMiddleware(reduxThunk, reduxPromise), //, logger),
  window.devToolsExtension ? window.devToolsExtension() : f => f)
);


var ReduxBehavior = new PolymerRedux(store);

export {ReduxBehavior, actions};
export default store;
