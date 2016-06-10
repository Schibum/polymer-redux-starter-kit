import counter from './reducers/index.js';

describe('reducers', () => {
  describe('counter', () => {
    it('should provide the initial state', () => {
      expect(counter(undefined, {})).toEqual({value: 0});
    });

    it('should handle INCREMENT action', () => {
      expect(counter({value: 1}, { type: 'INCREMENT' })).toEqual({value: 2});
    });

    it('should handle DECREMENT action', () => {
      expect(counter({value: 1}, { type: 'DECREMENT' })).toEqual({value: 0});
    });

    it('should ignore unknown actions', () => {
      expect(counter({value: 1}, { type: 'unknown' })).toEqual({value: 1});
    });
  });
});
