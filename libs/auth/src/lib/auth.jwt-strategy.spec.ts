import { AuthJwtStrategy } from './auth.jwt-strategy';

describe('AuthJwtStrategy', () => {
  it('should be defined', () => {
    expect(new AuthJwtStrategy()).toBeDefined();
  });
});
