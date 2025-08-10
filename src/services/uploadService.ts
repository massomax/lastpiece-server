import axios from "axios";
import FormData from "form-data";
import config from "../config";

interface UploadOptions { album?: string }

interface UploadedImage {
  url: string;
  deleteHash?: string;
  width?: number;
  height?: number;
  size?: number;
  id?: string;
}

export async function uploadImagesToImgur(files: Express.Multer.File[], opts: UploadOptions = {}): Promise<UploadedImage[]> {
  if (!config.uploads.imgurClientId) {
    const err: any = new Error("ImgurClientIdMissing");
    err.status = 500;
    throw err;
  }

  const headers = { Authorization: `Client-ID ${config.uploads.imgurClientId}` };

  const results: UploadedImage[] = [];
  for (const file of files) {
    const form = new FormData();
    form.append("image", file.buffer.toString("base64"));
    form.append("type", "base64");
    if (opts.album) form.append("album", opts.album);

    const { data } = await axios.post("https://api.imgur.com/3/image", form, {
      headers: { ...headers, ...form.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: (s) => s >= 200 && s < 500,
    });

    if (!data || !data.success) {
      const message = data?.data?.error || "ImgurUploadFailed";
      throw Object.assign(new Error(message), { status: 502 });
    }

    const payload = data.data;
    results.push({
      url: payload.link,
      deleteHash: payload.deletehash,
      width: payload.width,
      height: payload.height,
      size: payload.size,
      id: payload.id,
    });
  }
  return results;
}
