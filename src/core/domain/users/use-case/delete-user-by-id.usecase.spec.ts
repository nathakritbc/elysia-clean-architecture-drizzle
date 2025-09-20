import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { IUser, UserId } from '../entity/user.entity';
import { UserRepository } from '../service/user.repository';
import { NotFoundError } from '../../../shared/errors/error-mapper';
import { DeleteUserByIdUseCase } from './delete-user-by-id.usecase';

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
    userRepository.getById.mockResolvedValue(undefined);
    const errorExpected = new NotFoundError('User not found');

    //Act
    const promise = useCase.execute(userId);

    //Assert
    await expect(promise).rejects.toThrowError(errorExpected);
    expect(userRepository.getById).toHaveBeenCalledWith(userId);
    expect(userRepository.deleteById).not.toHaveBeenCalled();
  });

  it('should be delete user', async () => {
    //Arrange
    const user = mock<IUser>({ id: userId });
    userRepository.getById.mockResolvedValue(user);
    userRepository.deleteById.mockResolvedValue(undefined);

    //Act
    const actual = await useCase.execute(userId);
    //Assert
    expect(actual).toBeUndefined();
    expect(userRepository.getById).toHaveBeenCalledWith(userId);
    expect(userRepository.deleteById).toHaveBeenCalledWith(userId);
  });
});
