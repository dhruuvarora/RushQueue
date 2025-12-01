import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface SignupData {
  user_name: string;
  user_dob: string;
  user_mob: string;  
  user_email: string;
  user_password: string;
}

class SignupService {
  async signup(data: SignupData) {
    const { user_name, user_dob, user_mob, user_email, user_password } = data;

    // Check existing user
    const existingUser = await prisma.users.findUnique({
      where: { user_email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const saltRounds = process.env.SALT_ROUNDS
      ? parseInt(process.env.SALT_ROUNDS)
      : 10;

    const hashedPassword = await bcrypt.hash(user_password, saltRounds);

    // Create new user
    const newUser = await prisma.users.create({
      data: {
        user_name,
        user_dob: new Date(user_dob),
        user_mob,                     
        user_email,
        user_password: hashedPassword,
      },
    });

    return newUser;
  }
}

export default new SignupService();
