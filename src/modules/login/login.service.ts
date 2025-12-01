import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt.util";
import { db } from "../../db";

interface LoginData {
  user_email: string;
  user_password: string;
}

export class LoginService {
  async login(data: LoginData):Promise<{ token : string }> {
    const { user_email, user_password } = data;

    if (user_email === "" || user_password === "") {
      throw new Error("Email and Password cannot be empty");
    }

    const user = await db
      .selectFrom("Users")
      .selectAll()
      .where("user_email", "=", user_email)
      .executeTakeFirst();

    if(!user){
      throw new Error("No user found with this email");
    }

    // hash password and compare
    const isPasswordValid = await bcrypt.compare(user_password, user.user_password);
    if (!isPasswordValid) {
      throw new Error("Incorrect password");
    }

    const token = generateToken({
      user_id: user.user_id,
      email: user.user_email,
    });

    return { token };
  }
}

export default new LoginService();