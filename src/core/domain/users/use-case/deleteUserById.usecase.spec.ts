import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { IUser, UserId } from '../entity/user.entity';
import { UserRepository } from '../service/user.repository';
import { NotFoundError } from 'elysia';
import { DeleteUserByIdUseCase } from './deleteUserById.usecase';

describe('DeleteUserByIdUseCase', () => {
  let useCase: DeleteUserByIdUseCase;
  const userRepository = mock<UserRepository>();

  beforeEach(() => {
    useCase = new DeleteUserByIdUseCase(userRepository);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const userId = faker.string.uuid() as UserId;
  it('should be throw error when user not found', async () => {
    //Arrange
    userRepository.findById.mockResolvedValue(undefined);
    const errorExpected = new NotFoundError('User not found');

    //Act
    const actual = useCase.execute(userId);

    //Assert
    await expect(actual).rejects.toThrowError(errorExpected);
    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userRepository.deleteById).not.toHaveBeenCalled();
  });

  it('should be delete user', async () => {
    //Arrange
    const user = mock<IUser>({ id: userId });
    userRepository.findById.mockResolvedValue(user);
    userRepository.deleteById.mockResolvedValue(true);

    //Act
    const actual = await useCase.execute(userId);
    //Assert
    expect(actual).toBeTruthy();
    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userRepository.deleteById).toHaveBeenCalledWith(userId);
  });
});
