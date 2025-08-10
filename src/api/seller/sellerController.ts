import { Request, Response, NextFunction } from "express";
import * as sellerService from "../../services/sellerService";

export const registerSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // registerSeller теперь возвращает прямую пару токенов
    const { accessToken, refreshToken } = await sellerService.registerSeller(
      req.body
    );

    res
      .cookie("refreshToken", refreshToken, sellerService.cookieOpts())
      .status(201)
      .json({ accessToken });
  } catch (err) {
    next(err);
  }
};

export const loginSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    // Передаём объект dto вместо двух аргументов
    const { accessToken, refreshToken } = await sellerService.loginSeller({
      email,
      password,
    });

    res
      .cookie("refreshToken", refreshToken, sellerService.cookieOpts())
      .status(200)
      .json({ accessToken });
  } catch (err) {
    next(err);
  }
};

export const refreshTokens = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Сервис называется refreshTokens и возвращает пару токенов
    const { accessToken, refreshToken } = await sellerService.refreshTokens(
      req.cookies.refreshToken
    );

    res
      .cookie("refreshToken", refreshToken, sellerService.cookieOpts())
      .json({ accessToken });
  } catch (err) {
    next(err);
  }
};

export const logoutSeller = (_req: Request, res: Response): void => {
  // Берём опции куки, но без maxAge
  const { httpOnly, secure, domain, sameSite } = sellerService.cookieOpts();

  res
    .clearCookie("refreshToken", { httpOnly, secure, domain, sameSite })
    .sendStatus(204);
};
