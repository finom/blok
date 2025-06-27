import { HttpException, HttpStatus, createDecorator } from "vovk";

const cronGuard = createDecorator(async (req, next) => {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw new HttpException(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  return next();
});

export default cronGuard;
