import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { IUser, UserId } from '../entity/user.entity';
import { UserRepository } from '../service/user.repository';
import { DeleteByIdUseCase } from './deleteById.usecase';

describe('DeleteProductByIdUseCase', () => {
  let useCase: DeleteByIdUseCase;
  const productRepository = mock<UserRepository>();

  beforeEach(() => {
    useCase = new DeleteByIdUseCase(productRepository);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const productId = faker.string.uuid() as UserId;
  it('should be throw error when product not found', async () => {
    //Arrange
    productRepository.findById.mockResolvedValue(undefined);
    const errorExpected = new Error('User ID is required');

    //Act
    const actual = useCase.execute(productId);

    //Assert
    await expect(actual).rejects.toThrowError(errorExpected);
    expect(productRepository.findById).toHaveBeenCalledWith(productId);
    expect(productRepository.deleteById).not.toHaveBeenCalled();
  });

  it('should be delete product', async () => {
    //Arrange
    const product = mock<IUser>({ id: productId });
    productRepository.findById.mockResolvedValue(product);
    productRepository.deleteById.mockResolvedValue(true);

    //Act
    const actual = await useCase.execute(productId);
    //Assert
    expect(actual).toBeTruthy();
    expect(productRepository.findById).toHaveBeenCalledWith(productId);
    expect(productRepository.deleteById).toHaveBeenCalledWith(productId);
  });
});
