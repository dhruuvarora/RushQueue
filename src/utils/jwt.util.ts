import * as jwt from "jsonwebtoken";

export const generateToken = (
  payload: any,
  expiresIn: string | number = "7d"
) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET as string,
    { expiresIn } as jwt.SignOptions
  );
};
