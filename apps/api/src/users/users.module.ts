import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { FinanceModule } from '../finance/finance.module';

@Module({
    imports: [forwardRef(() => FinanceModule)],
    providers: [UsersService],
    exports: [UsersService],
    controllers: [UsersController],
})
export class UsersModule { }
