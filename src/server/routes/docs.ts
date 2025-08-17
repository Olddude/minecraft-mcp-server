import type { Router } from 'express';
import { Router as createRouter } from 'express';
import swaggerUi from 'swagger-ui-express';

export function createDocsRoutes(openApiSpec: Record<string, unknown>): Router {
    const router = createRouter();

    // OpenAPI specification endpoint
    router.get('/openapi.json', (req, res) => {
        res.json(openApiSpec);
    });

    // Swagger UI endpoint
    router.use('/openapi', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
        customSiteTitle: 'Minecraft MCP Server API',
        customCss: '.swagger-ui .topbar { display: none }',
        swaggerOptions: { persistAuthorization: true, displayRequestDuration: true, filter: true },
    }));

    return router;
}
