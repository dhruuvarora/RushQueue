import { Request, Response } from "express";
import  signupService from "./signup.service";

export class SignupController {
    async signup(req: Request, res: Response): Promise<void> {
        try {
            const {user_name, user_dob, user_mob, user_email, user_password} = req.body;

            const result = await signupService.signup({
                user_name,
                user_dob,
                user_mob,
                user_email,
                user_password
            })

            res.status(201).json({
                message: "User signed up successfully",
                data: result
            });
        } catch (err) {
            res.status(500).json({
                message: "Internal Server Error",
                error: err
            });
        }
    }
}

export default new SignupController();