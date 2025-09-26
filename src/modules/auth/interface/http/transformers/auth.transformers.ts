import type { IUser } from '@modules/accounts/domain/entities/user.entity';

export const toUserResponse = (user: IUser) => ({
  id: user.id as unknown as string,
  name: user.name as unknown as string,
  email: user.email as unknown as string,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
