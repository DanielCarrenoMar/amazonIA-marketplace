// =============================================================================
// BlockchainExplorerController — read-only endpoints for the explorer UI.
// Public (no auth) so the auditor view works without a session.
// Incluye endpoints seguros con proxy para votar, finalizar y vetar.
// =============================================================================

import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import type {
  FindProposalParamsDto,
  ListProposalsDto,
  MemberDto,
  ProposalDetailDto,
  ProposalStatus,
  ProposalSummaryDto,
} from 'event-types';
import { BlockchainExplorerService } from './services/blockchain-explorer.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/blockchain/explorer')
export class BlockchainExplorerController {
  constructor(
    private readonly service: BlockchainExplorerService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('proposals')
  async findProposals(
    @Query() dto: ListProposalsDto,
  ): Promise<ProposalSummaryDto[]> {
    return this.service.findProposals({
      status: dto.status as ProposalStatus | undefined,
    });
  }

  // Returns null (not 404) when the id is unknown — the frontend handles
  // missing proposals by rendering a not-found state in the route.
  @Get('proposals/:id')
  async findProposal(
    @Param() params: FindProposalParamsDto,
  ): Promise<ProposalDetailDto | null> {
    return this.service.findProposal(params.id);
  }

  @Get('members')
  async findMembers(): Promise<MemberDto[]> {
    return this.service.findMembers();
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals/:id/vote')
  async voteProposal(
    @Param('id') id: string,
    @Body() body: { inFavor: boolean },
    @Req() req: any,
  ) {
    const userId = req.user.id;
    // Verificar si el usuario es miembro de la gobernanza
    const member = await this.prisma.governanceMember.findUnique({
      where: { userId },
    });
    if (!member || member.role === 'NONE') {
      throw new ForbiddenException('You are not a registered member of the governance council.');
    }

    // Hacer proxy de la petición al Notario
    const notaryUrl = process.env.NOTARY_SERVICE_URL || 'http://localhost:3002/api/v1';
    const apiKey = process.env.NOTARY_API_KEY || 'apikeyBlockchain';

    try {
      const response = await fetch(`${notaryUrl}/governance/proposals/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          voterUserId: userId,
          inFavor: body.inFavor,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new BadRequestException(`Notary error: ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals/:id/finalize')
  async finalizeProposal(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    // Verificar si el usuario es Elder
    const member = await this.prisma.governanceMember.findUnique({
      where: { userId },
    });
    if (!member || member.role !== 'ELDER') {
      throw new ForbiddenException('Only the Elder can finalize proposals.');
    }

    // Hacer proxy al Notario
    const notaryUrl = process.env.NOTARY_SERVICE_URL || 'http://localhost:3002/api/v1';
    const apiKey = process.env.NOTARY_API_KEY || 'apikeyBlockchain';

    try {
      const response = await fetch(`${notaryUrl}/governance/proposals/${id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          elderUserId: userId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new BadRequestException(`Notary error: ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals/:id/veto')
  async vetoProposal(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    const userId = req.user.id;
    // Verificar si el usuario es Elder
    const member = await this.prisma.governanceMember.findUnique({
      where: { userId },
    });
    if (!member || member.role !== 'ELDER') {
      throw new ForbiddenException('Only the Elder can veto proposals.');
    }

    // Hacer proxy al Notario
    const notaryUrl = process.env.NOTARY_SERVICE_URL || 'http://localhost:3002/api/v1';
    const apiKey = process.env.NOTARY_API_KEY || 'apikeyBlockchain';

    try {
      const response = await fetch(`${notaryUrl}/governance/proposals/${id}/veto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          elderUserId: userId,
          reason: body.reason,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new BadRequestException(`Notary error: ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}

