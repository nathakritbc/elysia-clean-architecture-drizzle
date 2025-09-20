import { CreatedAt, Id, UpdatedAt } from "./common.type";

export class Entity {
  id: Id = "" as unknown as Id;
  createdAt?: CreatedAt;
  updatedAt?: UpdatedAt;
}
