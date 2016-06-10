import {redux, handleActions} from '../../../npm-imports.js';


const value = handleActions({
    INCREMENT(state, action) {
      return state + (action.payload || 1);
    },
    DECREMENT(state, action) {
      return state - 1;
    }
}, 0);

export default redux.combineReducers({value});

