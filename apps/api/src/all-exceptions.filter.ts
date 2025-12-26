import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        // In certain situations `httpAdapter` might not be available in the
        // constructor method, thus we should resolve it here.
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const responseBody = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(ctx.getRequest()),
            message: (exception as any).message || 'Internal Server Error',
            stack: (exception as any).stack || null, // EXPOSING STACK FOR DEBUG
            error: exception instanceof Object ? exception : String(exception),
        };

        console.error('GLOBAL EXCEPTION CAUGHT:', exception);

        const response = ctx.getResponse();

        // Manually set CORS headers for error responses to ensure the browser sees the actual error (401/500)
        // instead of a generic CORS error
        if (response.header) {
            const requestOrigin = ctx.getRequest().headers.origin || '*';
            response.header('Access-Control-Allow-Origin', requestOrigin);
            response.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
            response.header('Access-Control-Allow-Headers', '*');
            response.header('Access-Control-Allow-Credentials', 'true');
        }

        httpAdapter.reply(response, responseBody, httpStatus);
    }
}
