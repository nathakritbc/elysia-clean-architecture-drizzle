import { Builder } from 'builder-pattern';
import 'reflect-metadata';
import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { faker } from '@faker-js/faker';

import { NotFoundError } from '@shared/errors/error-mapper';
import { IPost, PostContent, PostCreatedAt, PostId, PostStatus, PostTitle, PostUpdatedAt } from '@modules/content/domain/entities/post.entity';
import { PostRepository } from '@modules/content/domain/ports/post.repository';
import { UpdatePostByIdUseCase } from '@modules/content/application/use-cases/update-post-by-id.usecase';

describe('UpdatePostByIdUseCase', () => {
  let useCase: UpdatePostByIdUseCase;
  const postRepository = mock<PostRepository>();

  beforeEach(() => {
    useCase = new UpdatePostByIdUseCase(postRepository);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const postId = faker.string.uuid() as PostId;
  it('should be throw error when post not found', async () => {
    //Arrange
    postRepository.getById.mockResolvedValue(undefined);
    const errorExpected = new NotFoundError('Post not found');

    const postInput = Builder<IPost>()
      .id(postId)
      .title(faker.person.fullName() as PostTitle)
      .content(faker.internet.email() as PostContent)
      .status(faker.internet.password() as PostStatus)
      .createdAt(faker.date.recent() as PostCreatedAt)
      .updatedAt(faker.date.recent() as PostUpdatedAt)
      .build();

    //Act
    const promise = useCase.execute(postInput);

    //Assert
    await expect(promise).rejects.toThrowError(errorExpected);
    expect(postRepository.getById).toHaveBeenCalledWith(postId);
    expect(postRepository.updateById).not.toHaveBeenCalled();
  });

  it('should be get post by id', async () => {
    //Arrange
    const post = mock<IPost>({ id: postId });
    postRepository.getById.mockResolvedValue(post);
    postRepository.updateById.mockResolvedValue(post);
    const postInput = post;

    const expected = postInput;

    //Act
    const actual = await useCase.execute(postInput);

    //Assert
    expect(actual).toEqual(expected);
    expect(postRepository.getById).toHaveBeenCalledWith(postId);
    expect(postRepository.updateById).toHaveBeenCalledWith(postInput);
  });
});
