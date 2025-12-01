import bcrypt from "bcryptjs";
import { db } from "../../db"; 

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

    // Check if user already exists
    const existingUser = await db
      .selectFrom("Users")
      .selectAll()
      .where("user_email", "=", user_email)
      .executeTakeFirst();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const saltRounds = parseInt(process.env.SALT_ROUNDS || "10");
    const hashedPassword = await bcrypt.hash(user_password, saltRounds);

    // Insert new user
    const insertResult = await db
      .insertInto("Users")
      .values({
        user_name,
        user_dob: new Date(user_dob),
        user_mob,
        user_email,
        user_password: hashedPassword,
      })
      .executeTakeFirstOrThrow();

    const userId = Number((insertResult as any).insertId);

    // Fetch the created user
    const createdUser = await db
      .selectFrom("Users")
      .selectAll()
      .where("user_id", "=", userId)
      .executeTakeFirst();

    return createdUser;
  }
}

export default new SignupService();
