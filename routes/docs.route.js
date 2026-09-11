const express = require("express");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");

// 1. Raw JSON endpoint for OpenAPI / Postman import
router.get("/openapi.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.json(swaggerDocument);
});

// 2. Swagger UI options with CDN assets to ensure 100% compatibility on Vercel Serverless
const swaggerUiOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Alkitab API V2 Documentation",
  customCssUrl: "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css",
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js"
  ],
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "list",
    defaultModelsExpandDepth: 1
  }
};

router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(swaggerDocument, swaggerUiOptions));

module.exports = router;
