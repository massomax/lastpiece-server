import { Request, Response, NextFunction } from "express";
import * as svc from "../../services/uploadService";

export async function uploadImages(req: Request, res: Response, next: NextFunction) {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) return res.status(400).json({ error: "NoFiles" });

    const album = (req.body.album as string) || undefined;
    const results = await svc.uploadImagesToImgur(files, { album });

    res.status(201).json({ items: results });
  } catch (e) { next(e); }
}
