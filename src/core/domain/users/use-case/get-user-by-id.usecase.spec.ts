import 'reflect-metadata';
import { UserRepository } from '../service/user.repository';
import { getUserByIdUseCase } from './get-user-by-id.usecase';
import { faker } from '@faker-js/faker';
import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { IUser, UserId } from '../entity/user.entity';
import { NotFoundError } from 'elysia';

describe('getUserByIdUseCase', () => {
  let useCase: getUserByIdUseCase;
  const userRepository = mock<UserRepository>();

  beforeEach(() => {
    useCase = new getUserByIdUseCase(userRepository);
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
    const promise = useCase.execute(userId);

    //Assert
    await expect(promise).rejects.toThrowError(errorExpected);
    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userRepository.deleteById).not.toHaveBeenCalled();
  });

  it('should be get user by id', async () => {
    //Arrange
    const user = mock<IUser>({ id: userId });
    userRepository.findById.mockResolvedValue(user);

    const expected = user;

    //Act
    const actual = await useCase.execute(userId);

    //Assert
    expect(actual).toEqual(expected);
    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userRepository.deleteById).not.toHaveBeenCalled();
  });
});
