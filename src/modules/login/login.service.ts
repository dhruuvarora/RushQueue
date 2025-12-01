import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt.util";

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

    const checkEmailExists = await Prisma.users.findUnique({
      where: { user_email },
    });

    if(!checkEmailExists){
      throw new Error("No user found with this email");
    }

    // hash password and compare
    const isPasswordValid = await bcrypt.compare(user_password, checkEmailExists.user_password);
    if (!isPasswordValid) {
      throw new Error("Incorrect password");
    }

    const token = generateToken({
      user_id: checkEmailExists.user_id,
      email: checkEmailExists.user_email,
    });

    return { token };
  }
}

export default new LoginService();