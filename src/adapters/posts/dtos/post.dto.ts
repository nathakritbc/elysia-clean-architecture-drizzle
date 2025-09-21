import { t } from 'elysia';
import { GetAllMetaDto, GetAllParamsDto, StatusDto } from '../../../core/shared/dtos/common.dto';

export const PostDto = t.Object({
  id: t.String(),
  title: t.String(),
  content: t.String(),
  status: StatusDto,
  createdAt: t.Optional(t.Date()),
  updatedAt: t.Optional(t.Date()),
});

export const GetAllPostsQueryDto = t.Object({
  ...GetAllParamsDto.properties,
});

export const GetAllPostsReturnTypeDto = t.Object({
  result: t.Array(PostDto),
  meta: GetAllMetaDto,
});

// Create Post Request DTO
export const CreatePostRequestDto = t.Object({
  title: t.String({ minLength: 1, maxLength: 200 }),
  content: t.String({ minLength: 1 }),
});

// Create Post Response DTO
export const CreatePostResponseDto = PostDto;

export const ErrorResponseDto = t.Object({
  name: t.String(),
  message: t.String(),
});

export type PostDtoType = typeof PostDto;
export type CreatePostRequestDtoType = typeof CreatePostRequestDto;
export type CreatePostResponseDtoType = typeof CreatePostResponseDto;
export type GetAllPostsQueryDtoType = typeof GetAllPostsQueryDto;
export type GetAllPostsReturnTypeDtoType = typeof GetAllPostsReturnTypeDto;
export type ErrorResponseDtoType = typeof ErrorResponseDto;
