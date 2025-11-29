declare namespace Express {
  export interface Request {
    user?: {
      user_id: number;
      user_email: string;
    };
  }
}
