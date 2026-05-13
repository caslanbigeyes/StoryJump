"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const workers_module_1 = require("./workers.module");
async function bootstrap() {
    const logger = new common_1.Logger('WorkerMain');
    const app = await core_1.NestFactory.createApplicationContext(workers_module_1.WorkersModule, {
        logger: ['log', 'warn', 'error'],
    });
    logger.log('StoryJump Pipeline Worker started');
    await app.init();
}
bootstrap().catch((err) => {
    console.error('Worker failed to start', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map