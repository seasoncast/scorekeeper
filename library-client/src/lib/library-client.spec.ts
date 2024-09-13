import { libraryClient } from './library-client';

describe('libraryClient', () => {
  it('should work', () => {
    expect(libraryClient()).toEqual('library-client');
  });
});
