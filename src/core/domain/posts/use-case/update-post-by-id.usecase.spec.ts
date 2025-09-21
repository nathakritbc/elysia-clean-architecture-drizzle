import 'reflect-metadata';
import { PostRepository } from '../service/post.repository';
import { faker } from '@faker-js/faker';
import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { IPost, PostStatus, PostTitle, PostContent, PostId, PostCreatedAt, PostUpdatedAt } from '../entity/post.entity';
import { NotFoundError } from '../../../shared/errors/error-mapper';
import { UpdatePostByIdUseCase } from './update-post-by-id.usecase';
import { Builder } from 'builder-pattern';

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
