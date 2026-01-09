import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBugDto } from './dto/create-bug.dto';
import { UpdateBugDto } from './dto/update-bug.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { BugStatus, BugSeverity, BugPriority } from '@prisma/client';

@Injectable()
export class BugsService {
    constructor(private prisma: PrismaService) { }

    async create(createBugDto: CreateBugDto, userId: string, companyId: string) {
        return this.prisma.bugReport.create({
            data: {
                ...createBugDto,
                reportedByUserId: userId,
                companyId,
            },
            include: {
                reportedByUser: {
                    select: { id: true, name: true, username: true },
                },
                assignedToUser: {
                    select: { id: true, name: true, username: true },
                },
            },
        });
    }

    async findAll(companyId: string, filters?: {
        status?: BugStatus;
        severity?: BugSeverity;
        priority?: BugPriority;
        assignedToUserId?: string;
    }) {
        return this.prisma.bugReport.findMany({
            where: {
                companyId,
                ...(filters?.status && { status: filters.status }),
                ...(filters?.severity && { severity: filters.severity }),
                ...(filters?.priority && { priority: filters.priority }),
                ...(filters?.assignedToUserId && { assignedToUserId: filters.assignedToUserId }),
            },
            include: {
                reportedByUser: {
                    select: { id: true, name: true, username: true },
                },
                assignedToUser: {
                    select: { id: true, name: true, username: true },
                },
                fixedByUser: {
                    select: { id: true, name: true, username: true },
                },
                validatedByUser: {
                    select: { id: true, name: true, username: true },
                },
                _count: {
                    select: { comments: true },
                },
            },
            orderBy: [
                { priority: 'asc' },
                { severity: 'asc' },
                { createdAt: 'desc' },
            ],
        });
    }

    async findOne(id: string, companyId: string) {
        const bug = await this.prisma.bugReport.findFirst({
            where: { id, companyId },
            include: {
                reportedByUser: {
                    select: { id: true, name: true, username: true },
                },
                assignedToUser: {
                    select: { id: true, name: true, username: true },
                },
                fixedByUser: {
                    select: { id: true, name: true, username: true },
                },
                validatedByUser: {
                    select: { id: true, name: true, username: true },
                },
                comments: {
                    include: {
                        user: {
                            select: { id: true, name: true, username: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!bug) {
            throw new NotFoundException('Bug report não encontrado');
        }

        return bug;
    }

    async update(id: string, updateBugDto: UpdateBugDto, userId: string, companyId: string) {
        const bug = await this.findOne(id, companyId);

        const updateData: any = { ...updateBugDto };

        // Se o status mudou para FIXED, registrar quem corrigiu
        if (updateBugDto.status === BugStatus.FIXED && bug.status !== BugStatus.FIXED) {
            updateData.fixedAt = new Date();
            updateData.fixedByUserId = userId;
        }

        // Se o status mudou para VALIDATED, registrar quem validou
        if (updateBugDto.status === BugStatus.VALIDATED && bug.status !== BugStatus.VALIDATED) {
            updateData.validatedAt = new Date();
            updateData.validatedByUserId = userId;
        }

        return this.prisma.bugReport.update({
            where: { id },
            data: updateData,
            include: {
                reportedByUser: {
                    select: { id: true, name: true, username: true },
                },
                assignedToUser: {
                    select: { id: true, name: true, username: true },
                },
                fixedByUser: {
                    select: { id: true, name: true, username: true },
                },
                validatedByUser: {
                    select: { id: true, name: true, username: true },
                },
            },
        });
    }

    async addComment(bugId: string, addCommentDto: AddCommentDto, userId: string, companyId: string) {
        // Verificar se o bug existe e pertence à empresa
        await this.findOne(bugId, companyId);

        return this.prisma.bugComment.create({
            data: {
                bugReportId: bugId,
                userId,
                ...addCommentDto,
            },
            include: {
                user: {
                    select: { id: true, name: true, username: true },
                },
            },
        });
    }

    async getStatistics(companyId: string) {
        const [total, open, inProgress, fixed, validated, closed] = await Promise.all([
            this.prisma.bugReport.count({ where: { companyId } }),
            this.prisma.bugReport.count({ where: { companyId, status: BugStatus.OPEN } }),
            this.prisma.bugReport.count({ where: { companyId, status: BugStatus.IN_PROGRESS } }),
            this.prisma.bugReport.count({ where: { companyId, status: BugStatus.FIXED } }),
            this.prisma.bugReport.count({ where: { companyId, status: BugStatus.VALIDATED } }),
            this.prisma.bugReport.count({ where: { companyId, status: BugStatus.CLOSED } }),
        ]);

        return {
            total,
            byStatus: {
                open,
                inProgress,
                fixed,
                validated,
                closed,
            },
        };
    }

    async delete(id: string, companyId: string) {
        await this.findOne(id, companyId);

        return this.prisma.bugReport.delete({
            where: { id },
        });
    }
}
