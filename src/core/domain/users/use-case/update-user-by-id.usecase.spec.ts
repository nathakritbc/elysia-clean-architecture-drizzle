import 'reflect-metadata';
import { UpdateUserByIdInput, UserRepository } from '../service/user.repository';
import { faker } from '@faker-js/faker';
import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { IUser, UserId } from '../entity/user.entity';
import { NotFoundError } from 'elysia';
import { UpdateUserByIdUseCase } from './update-user-by-id.usecase';
import { Builder } from 'builder-pattern';

describe('UpdateUserByIdUseCase', () => {
  let useCase: UpdateUserByIdUseCase;
  const userRepository = mock<UserRepository>();

  beforeEach(() => {
    useCase = new UpdateUserByIdUseCase(userRepository);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const userId = faker.string.uuid() as UserId;
  it('should be throw error when user not found', async () => {
    //Arrange
    userRepository.getById.mockResolvedValue(undefined);
    const errorExpected = new NotFoundError('User not found');

    const userInput = Builder<UpdateUserByIdInput>().id(userId).user(mock<IUser>()).build();

    //Act
    const promise = useCase.execute(userInput);

    //Assert
    await expect(promise).rejects.toThrowError(errorExpected);
    expect(userRepository.getById).toHaveBeenCalledWith(userId);
    expect(userRepository.updateById).not.toHaveBeenCalled();
  });

  it('should be get user by id', async () => {
    //Arrange
    const user = mock<IUser>({ id: userId });
    userRepository.getById.mockResolvedValue(user);
    userRepository.updateById.mockResolvedValue(user);
    const userInput = Builder<UpdateUserByIdInput>().id(userId).user(user).build();
    const expected = userInput.user;

    //Act
    const actual = await useCase.execute(userInput);

    //Assert
    expect(actual).toEqual(expected);
    expect(userRepository.getById).toHaveBeenCalledWith(userId);
    expect(userRepository.updateById).toHaveBeenCalledWith(userInput);
  });
});
