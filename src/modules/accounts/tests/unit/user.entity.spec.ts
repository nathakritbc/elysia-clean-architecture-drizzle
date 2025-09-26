import { Builder } from 'builder-pattern';
import { vi } from 'vitest';

import { User, UserPassword } from '@modules/accounts/domain/entities/user.entity';

describe('User', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      // Arrange
      const password = 'testPassword123' as UserPassword;
      const user = Builder(User).build();
      await user.setHashPassword(password);

      // Act
      const isMatch = await user.comparePassword(password);

      // Assert
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      // Arrange
      const password = 'testPassword123' as UserPassword;
      const wrongPassword = 'wrongPassword456' as UserPassword;
      const user = Builder(User).build();
      await user.setHashPassword(password);

      // Act
      const isMatch = await user.comparePassword(wrongPassword);

      // Assert
      expect(isMatch).toBe(false);
    });
  });

  describe('hiddenPassword', () => {
    it('should be hidden password', () => {
      // Arrange
      const password = 'testPassword123' as UserPassword;
      const user = Builder(User).password(password).build();
      const expected = '' as UserPassword;
      //Act
      user.hiddenPassword();

      // Assert
      expect(user.password).toBe(expected);
      expect(user.password).not.toBe(password);
    });
  });
});
