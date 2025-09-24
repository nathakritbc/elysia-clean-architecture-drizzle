import 'reflect-metadata';
import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { faker } from '@faker-js/faker';

import { NotFoundError } from '../../../shared/errors/error-mapper';
import { IPost, PostId } from '../entity/post.entity';
import { PostRepository } from '../service/post.repository';
import { GetPostByIdUseCase } from './get-post-by-id.usecase';

describe('GetPostByIdUseCase', () => {
  let useCase: GetPostByIdUseCase;
  const postRepository = mock<PostRepository>();

  beforeEach(() => {
    useCase = new GetPostByIdUseCase(postRepository);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const postId = faker.string.uuid() as PostId;
  it('should be throw error when post not found', async () => {
    //Arrange
    postRepository.getById.mockResolvedValue(undefined);
    const errorExpected = new NotFoundError('Post not found');

    //Act
    const promise = useCase.execute(postId);

    //Assert
    await expect(promise).rejects.toThrowError(errorExpected);
    expect(postRepository.getById).toHaveBeenCalledWith(postId);
    expect(postRepository.deleteById).not.toHaveBeenCalled();
  });

  it('should be get post by id', async () => {
    //Arrange
    const post = mock<IPost>({ id: postId });
    postRepository.getById.mockResolvedValue(post);

    const expected = post;

    //Act
    const actual = await useCase.execute(postId);

    //Assert
    expect(actual).toEqual(expected);
    expect(postRepository.getById).toHaveBeenCalledWith(postId);
    expect(postRepository.deleteById).not.toHaveBeenCalled();
  });
});
