"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const app_module_1 = require("./app.module");
const rpc_exception_filter_1 = require("./common/filters/rpc-exception.filter");
async function bootstrap() {
    const logger = new common_1.Logger('IngestorService');
    const required = ['INGESTOR_API_KEY', 'HIVEMQ_HOST', 'HIVEMQ_USERNAME', 'HIVEMQ_PASSWORD'];
    for (const key of required) {
        if (!process.env[key]) {
            logger.error(`Missing required environment variable: ${key}`);
            process.exit(1);
        }
    }
    const app = await core_1.NestFactory.createMicroservice(app_module_1.AppModule, {
        transport: microservices_1.Transport.MQTT,
        options: {
            host: process.env.HIVEMQ_HOST,
            port: process.env.HIVEMQ_PORT ? parseInt(process.env.HIVEMQ_PORT, 10) : 8883,
            protocol: 'mqtts',
            username: process.env.HIVEMQ_USERNAME,
            password: process.env.HIVEMQ_PASSWORD,
        },
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new rpc_exception_filter_1.LogRpcExceptionFilter());
    await app.listen();
    logger.log('📡 MQTT Microservice listener started successfully');
}
bootstrap();
//# sourceMappingURL=main.js.map