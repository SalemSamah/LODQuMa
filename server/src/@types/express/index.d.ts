import { IUser } from "@entities/User";

declare module "express" {
  export interface Request {
    body: {
      user: IUser;
      domain: string;
      rows: number;
    };
  }
}


