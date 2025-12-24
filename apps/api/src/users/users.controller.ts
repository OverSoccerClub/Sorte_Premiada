import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@repo/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Patch('push-token')
    @UseGuards(JwtAuthGuard)
    async updatePushToken(@Request() req: any, @Body('pushToken') pushToken: string) {
        return this.usersService.updatePushToken(req.user.userId, pushToken); // userId vem do JWT strategy
    }

    @Get('profile')
    getProfile(@Request() req: any) {
        console.log('UsersController: getProfile called', req.user);
        return this.usersService.findById(req.user.userId);
    }

    @Patch('profile')
    async updateProfile(@Request() req: any, @Body() updateUserDto: Prisma.UserUpdateInput) {
        if (updateUserDto.password && typeof updateUserDto.password === 'string') {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        // Prevent updating sensitive fields like role or id if necessary, 
        // but for now we trust the DTO or assume the service handles it. 
        // Ideally we should have a separate DTO for profile updates.
        return this.usersService.update(req.user.userId, updateUserDto);
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    async create(@Body() createUserDto: Prisma.UserCreateInput) {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        return this.usersService.create({
            ...createUserDto,
            password: hashedPassword,
        });
    }

    @Get()
    @UseGuards(RolesGuard)
    // @Roles('ADMIN')
    async findAll(@Query('username') username?: string) {
        const users = await this.usersService.findAll(username);
        // console.log('UsersController: findAll called. Users found:', users.length);
        if (!username) { // Only log counts for full list to avoid spam on individual checks
            // console.log('Roles found:', users.map(u => u.role));
            const cambistaCount = users.filter(u => (u.role as any) === 'CAMBISTA' || (u.role as any) === 'cambista').length;
            // console.log('Users with matching role count:', cambistaCount);
        }
        return users;
    }

    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    async update(@Param('id') id: string, @Body() updateUserDto: Prisma.UserUpdateInput) {
        if (updateUserDto.password && typeof updateUserDto.password === 'string') {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    @Patch(':id/limit')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    async updateLimit(@Param('id') id: string, @Body() body: { salesLimit?: number, limitOverrideExpiresAt?: Date | string, accountabilityLimitHours?: number }) {
        const data: Prisma.UserUpdateInput = {};
        if (body.salesLimit !== undefined) data.salesLimit = body.salesLimit;
        if (body.limitOverrideExpiresAt !== undefined) data.limitOverrideExpiresAt = body.limitOverrideExpiresAt;
        if (body.accountabilityLimitHours !== undefined) data.accountabilityLimitHours = body.accountabilityLimitHours;

        return this.usersService.update(id, data);
    }
}
