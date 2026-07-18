import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  ParseUUIDPipe,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { TribeService } from './tribe.service';
import { 
  CreateTribeDto,  
  UpdateTribeDto,
  UserRole,
  PaginationDto,
  TribeResponseDto,
  PaginatedResponseDto,
  RequestTribeCreationDto,
  ReviewTribeCreationDto,
  RequestTribeMembershipDto,
  ReviewTribeMembershipDto,
  AssignTribeLeaderDto,
  TribeMembershipRequestResponseDto
} from 'event-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TribeLeaderGuard } from '../auth/guards/tribe-leader.guard';
import { TribeLeader, PrimaryLeaderOnly } from '../auth/decorators/tribe-leader.decorator';

@Controller('tribe')
export class TribeController {
  constructor(private readonly tribeService: TribeService) {}

  // ===========================================================================
  // Tribe Creation Flow
  // ===========================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.SELLER)
  @Post('request-creation')
  requestCreation(@Request() req: any, @Body() dto: RequestTribeCreationDto): Promise<TribeResponseDto> {
    return this.tribeService.requestCreation(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('pending-creations')
  findPendingCreations(@Query() query: PaginationDto): Promise<PaginatedResponseDto<TribeResponseDto>> {
    return this.tribeService.findPendingCreations(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/review-creation')
  reviewCreation(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: ReviewTribeCreationDto,
  ): Promise<TribeResponseDto> {
    return this.tribeService.reviewCreation(id, req.user.id, dto);
  }

  // ===========================================================================
  // Membership Flow
  // ===========================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.SELLER)
  @Post(':id/request-membership')
  requestMembership(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: RequestTribeMembershipDto,
  ): Promise<TribeMembershipRequestResponseDto> {
    return this.tribeService.requestMembership(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, TribeLeaderGuard)
  @TribeLeader()
  @Get(':id/membership-requests')
  findMembershipRequests(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: any,
  ): Promise<PaginatedResponseDto<TribeMembershipRequestResponseDto>> {
    return this.tribeService.findMembershipRequests(id, query);
  }

  @UseGuards(JwtAuthGuard, TribeLeaderGuard)
  @TribeLeader()
  @Patch(':id/membership/:requestId/review')
  reviewMembership(
    @Param('id', ParseIntPipe) id: number,
    @Param('requestId', ParseIntPipe) requestId: number,
    @Request() req: any,
    @Body() dto: ReviewTribeMembershipDto,
  ): Promise<TribeMembershipRequestResponseDto> {
    return this.tribeService.reviewMembership(requestId, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('all-membership-requests')
  findAllMembershipRequests(@Query() query: PaginationDto & { status?: string }): Promise<PaginatedResponseDto<TribeMembershipRequestResponseDto>> {
    return this.tribeService.findAllMembershipRequests(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('membership/:requestId/review-admin')
  reviewMembershipAsAdmin(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() dto: ReviewTribeMembershipDto,
  ): Promise<TribeMembershipRequestResponseDto> {
    return this.tribeService.reviewMembershipAsAdmin(requestId, dto);
  }

  // ===========================================================================
  // Tribe Management Flow
  // ===========================================================================

  @UseGuards(JwtAuthGuard, TribeLeaderGuard)
  @PrimaryLeaderOnly()
  @Patch(':id/assign-leader')
  assignSecondaryLeader(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignTribeLeaderDto,
  ): Promise<TribeResponseDto> {
    return this.tribeService.assignSecondaryLeader(id, dto);
  }

  @UseGuards(JwtAuthGuard, TribeLeaderGuard)
  @PrimaryLeaderOnly()
  @Delete(':id/remove-leader')
  removeSecondaryLeader(@Param('id', ParseIntPipe) id: number): Promise<TribeResponseDto> {
    return this.tribeService.removeSecondaryLeader(id);
  }

  @UseGuards(JwtAuthGuard, TribeLeaderGuard)
  @TribeLeader()
  @Delete(':id/members/:sellerId')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('sellerId', ParseUUIDPipe) sellerId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.tribeService.removeMember(id, sellerId, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post('leave')
  leaveTribe(@Request() req: any): Promise<void> {
    return this.tribeService.leaveTribe(req.user.id);
  }

  // ===========================================================================
  // Standard CRUD Flow
  // ===========================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.SELLER)
  @Get('my-creation-requests')
  getMyCreationRequests(@Request() req: any): Promise<TribeResponseDto[]> {
    return this.tribeService.getMyCreationRequests(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.BUYER, UserRole.ADMIN)
  @Get('my-membership-requests')
  getMyMembershipRequests(@Request() req: any): Promise<TribeMembershipRequestResponseDto[]> {
    return this.tribeService.getMyMembershipRequests(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.BUYER, UserRole.ADMIN)
  @Get('my-tribe')
  getMyTribe(@Request() req: any): Promise<TribeResponseDto> {
    return this.tribeService.getMyTribe(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createTribeDto: CreateTribeDto): Promise<TribeResponseDto> {
    return this.tribeService.create(createTribeDto);
  }

  @Get()
  findAll(@Query() query: PaginationDto): Promise<PaginatedResponseDto<TribeResponseDto>> {
    return this.tribeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<TribeResponseDto> {
    return this.tribeService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTribeDto: UpdateTribeDto,
  ): Promise<TribeResponseDto> {
    return this.tribeService.update(id, updateTribeDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<TribeResponseDto> {
    return this.tribeService.remove(id);
  }
}
