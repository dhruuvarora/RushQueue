import { Request, Response } from "express";
import LoginService from "./login.service";

export class LoginController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { user_email, user_password } = req.body;

      const result = await LoginService.login({
        user_email,
        user_password,
      });

      res.status(200).json({
        message: "User logged in successfully",
        token: result.token,
      });
    } catch (error: any) {
      res.status(400).json({
        message: error.message || "Something went wrong",
      });
    }
  }
}

export default new LoginController();
