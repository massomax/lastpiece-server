declare namespace Express {
  interface Request {
    user?: { sub: string; role: "seller" | "admin" | "user" };
  }
}
