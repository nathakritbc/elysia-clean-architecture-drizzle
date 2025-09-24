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

// Update Post Request DTO
export const UpdatePostRequestDto = t.Object(
  {
    title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
    content: t.Optional(t.String({ minLength: 1 })),
    status: t.Optional(StatusDto),
  },
  { additionalProperties: false }
);

// Update Post Response DTO
export const UpdatePostResponseDto = PostDto;

// Delete Post Response DTO
export const DeletePostResponseDto = t.Object({
  success: t.Boolean(),
});

// Get Post Response DTO (single post)
export const GetPostResponseDto = PostDto;

// Path Parameters DTO
export const PostIdParamsDto = t.Object({
  id: t.String(),
});

export const ErrorResponseDto = t.Object({
  name: t.String(),
  message: t.String(),
});

export type PostDtoType = typeof PostDto;
export type CreatePostRequestDtoType = typeof CreatePostRequestDto;
export type CreatePostResponseDtoType = typeof CreatePostResponseDto;
export type UpdatePostRequestDtoType = typeof UpdatePostRequestDto;
export type UpdatePostResponseDtoType = typeof UpdatePostResponseDto;
export type DeletePostResponseDtoType = typeof DeletePostResponseDto;
export type GetPostResponseDtoType = typeof GetPostResponseDto;
export type GetAllPostsQueryDtoType = typeof GetAllPostsQueryDto;
export type GetAllPostsReturnTypeDtoType = typeof GetAllPostsReturnTypeDto;
export type PostIdParamsDtoType = typeof PostIdParamsDto;
export type ErrorResponseDtoType = typeof ErrorResponseDto;
