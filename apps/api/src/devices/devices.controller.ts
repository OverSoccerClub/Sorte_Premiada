import { Controller, Post, Body, Get } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
    constructor(private readonly devicesService: DevicesService) { }

    @Post('register')
    async register(@Body() body: { deviceId: string; model?: string; appVersion?: string }) {
        return this.devicesService.register(body);
    }

    @Post('heartbeat')
    async heartbeat(@Body() body: { deviceId: string; latitude?: number; longitude?: number; currentUserId?: string; status?: string }) {
        return this.devicesService.heartbeat(body);
    }

    @Get()
    async findAll() {
        return this.devicesService.findAll();
    }
}
