"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const node_path_1 = require("node:path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const requestLogger = new common_1.Logger('HTTP');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.set('etag', false);
    app.use('/healthz', (_req, res) => {
        res.status(200).send('ok');
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    app.enableCors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.use((req, res, next) => {
        const startedAt = Date.now();
        res.on('finish', () => {
            requestLogger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
        });
        next();
    });
    app.useStaticAssets((0, node_path_1.join)(process.cwd(), 'public'), {
        prefix: '/public/',
    });
    const port = process.env.PORT ?? 3000;
    const server = await app.listen(port, '0.0.0.0');
    globalThis.__storyjumpApp = app;
    globalThis.__storyjumpServer = server;
    logger.log(`Application is running on: http://127.0.0.1:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map