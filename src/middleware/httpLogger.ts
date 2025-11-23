import { Request, Response, NextFunction } from "express";
import chalk from "chalk";

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start).toFixed(2);

    // METHOD COLORS
    const methodColors: any = {
      GET: chalk.green,
      POST: chalk.yellow,
      PUT: chalk.blue,
      DELETE: chalk.red,
      PATCH: chalk.magenta,
    };

    const color = methodColors[req.method] || chalk.white;

    console.log(
      `${chalk.gray("HTTP →")} ${color(req.method)} ${chalk.cyan(
        req.originalUrl
      )} ${chalk.green(res.statusCode)} - ${chalk.yellow(`${duration} ms`)}`
    );
  });

  next();
};
