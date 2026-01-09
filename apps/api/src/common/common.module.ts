import { Module, Global } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { PosDeviceGuard } from './guards/pos-device.guard';
import { DevicesModule } from '../devices/devices.module';

/**
 * CommonModule
 * 
 * Global module that provides tenant context services
 * and POS device authentication guard to all other modules.
 */
@Global()
@Module({
    imports: [DevicesModule], // Importar para ter acesso ao DevicesService
    providers: [TenantContextService, PosDeviceGuard],
    exports: [TenantContextService, PosDeviceGuard],
})
export class CommonModule { }
