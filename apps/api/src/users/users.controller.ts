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
        return this.usersService.update(req.user.userId, updateUserDto, req.user.userId);
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    async create(@Body() createUserDto: Prisma.UserCreateInput, @Request() req: any) {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        // Inject companyId from Admin
        const companyId = req.user.companyId;

        const data: Prisma.UserCreateInput = {
            ...createUserDto,
            password: hashedPassword,
        };

        if (companyId) {
            data.company = { connect: { id: companyId } };
        }

        return this.usersService.create(data);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'COBRADOR')
    async findAll(@Request() req: any, @Query('username') username?: string, @Query('role') role?: string) {
        const users = await this.usersService.findAll(username, role, req.user.userId, req.user.companyId);
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
    async update(@Param('id') id: string, @Body() updateUserDto: Prisma.UserUpdateInput, @Request() req: any) {
        if (updateUserDto.password && typeof updateUserDto.password === 'string') {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        return this.usersService.update(id, updateUserDto, req.user.userId);
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
    async updateLimit(@Param('id') id: string, @Body() body: { salesLimit?: number, limitOverrideExpiresAt?: Date | string, accountabilityLimitHours?: number }, @Request() req: any) {
        const data: Prisma.UserUpdateInput = {};
        if (body.salesLimit !== undefined) data.salesLimit = body.salesLimit;
        if (body.limitOverrideExpiresAt !== undefined) data.limitOverrideExpiresAt = body.limitOverrideExpiresAt;
        if (body.accountabilityLimitHours !== undefined) data.accountabilityLimitHours = body.accountabilityLimitHours;

        return this.usersService.update(id, data, req.user.userId);
    }
}
