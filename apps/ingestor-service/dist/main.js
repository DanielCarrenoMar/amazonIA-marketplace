"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const logger = new common_1.Logger('IngestorService');
    const required = ['INGESTOR_API_KEY', 'HIVEMQ_HOST', 'HIVEMQ_USERNAME', 'HIVEMQ_PASSWORD'];
    for (const key of required) {
        if (!process.env[key]) {
            logger.error(`Missing required environment variable: ${key}`);
            process.exit(1);
        }
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.connectMicroservice({
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
    app.use((0, helmet_1.default)({
        hsts: process.env.NODE_ENV === 'production'
            ? { maxAge: 31536000, includeSubDomains: true }
            : false,
    }));
    app.enableCors({ origin: '*' });
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    await app.startAllMicroservices();
    logger.log('📡 MQTT Microservice listener started successfully');
    const port = process.env.PORT ?? 3002;
    await app.listen(port);
    logger.log(`🚀 Ingestor HTTP Service running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map