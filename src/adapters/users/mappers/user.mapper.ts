import { Builder } from "builder-pattern";
import { IUser } from "../../../core/domain/users/entity/user.entity";
import { UserResponseDto } from "../../../core/shared/dtos/user.dto";

export class UserMapper {
  static mapToDto(user: IUser): UserResponseDto {
    return Builder<UserResponseDto>()
      .id(user.id)
      .name(user.name)
      .email(user.email)
      .password(user.password)
      .status(user.status)
      .createdAt(user.createdAt)
      .updatedAt(user.updatedAt)
      .build();
  }

  static mapToDtoArray(users: IUser[]): UserResponseDto[] {
    return users.map((user) => this.mapToDto(user));
  }
}
