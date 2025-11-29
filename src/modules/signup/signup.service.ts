import bcrypt from "bcrypt";
import { PrismaClient } from "../../generated/prisma";

const Prisma = new PrismaClient();

export interface SignupData {
    user_name: string;
    user_dob: string;
    user_mobile: string;
    user_email: string;
    user_password: string;
}

export class signupService {
    async signup(data: SignupData) {
        const { user_name, user_dob, user_mobile, user_email, user_password } = data;

        const checkExistingUser = await Prisma.users.findUnique({
            where: { user_email }
        });

        if(checkExistingUser){
            throw new Error("User with this email already exists");
        }

        const hashedPassword = await bcrypt.hash(user_password, process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 10);

        // create a new user
        const newUser = await Prisma.users.create({
            data: {
                user_name,
                user_dob: new Date(user_dob),
                user_mob: user_mobile,
                user_email,
                user_password: hashedPassword
            }
        })

        return newUser;
    }
}

export default new signupService();