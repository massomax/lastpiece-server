import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import type { Application } from "express";

export function initSwagger(app: Application) {
  const specPath = path.resolve(__dirname, "../docs/openapi.yaml");
  const swaggerDoc = YAML.load(specPath);

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
    explorer: true,
  }));

  app.get("/openapi.yaml", (_req, res) => {
    res.sendFile(specPath);
  });
}