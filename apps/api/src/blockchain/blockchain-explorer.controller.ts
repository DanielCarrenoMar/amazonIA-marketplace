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

// Bounds how long a proxied request to blockchain-notary can hang — without this,
// a stuck notary (e.g. waiting on the Hardhat node) blocks the caller indefinitely.
const NOTARY_TIMEOUT_MS = 10_000;

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
    @Param('id') id: string,
  ): Promise<ProposalDetailDto | null> {
    return this.service.findProposal(id);
  }

  @Get('members')
  async findMembers(): Promise<MemberDto[]> {
    return this.service.findMembers();
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals')
  async createProposal(
    @Body() body: { proposalId: string; contentHash: string; deadlineMinutes: number; type: string },
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const member = await this.prisma.governanceMember.findUnique({
      where: { userId },
    });
    if (!member || member.role === 'NONE') {
      throw new ForbiddenException('You are not a registered member of the governance council.');
    }

    const notaryUrl = process.env.NOTARY_SERVICE_URL || 'http://localhost:3004/api/v1';
    const apiKey = process.env.NOTARY_API_KEY || 'apikeyBlockchain';

    try {
      const response = await fetch(`${notaryUrl}/governance/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          proposalId: body.proposalId,
          contentHash: body.contentHash,
          proposerUserId: userId,
          deadlineMinutes: body.deadlineMinutes,
          type: body.type,
        }),
        signal: AbortSignal.timeout(NOTARY_TIMEOUT_MS),
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
    const notaryUrl = process.env.NOTARY_SERVICE_URL || 'http://localhost:3004/api/v1';
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
        signal: AbortSignal.timeout(NOTARY_TIMEOUT_MS),
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
    // Verificar si el usuario es Elder o el líder de la tribu de la propuesta
    const member = await this.prisma.governanceMember.findUnique({
      where: { userId },
    });

    let isAuthorized = member && member.role === 'ELDER';

    if (!isAuthorized) {
      const proposal = await this.prisma.proposal.findUnique({
        where: { proposalId: id },
      });
      if (proposal) {
        if (proposal.type === 'TRIBE_ADMISSION' || proposal.type === 'TRIBE_EXPULSION') {
          // Líderes pueden finalizar propuestas de admisión/expulsión de su tribu
          try {
            const content = JSON.parse(proposal.contentHash);
            if (content && typeof content.tribeId === 'number') {
              const tribe = await this.prisma.tribe.findUnique({
                where: { id: content.tribeId },
              });
              if (tribe && (tribe.primaryLeaderId === userId || tribe.secondaryLeaderId === userId)) {
                isAuthorized = true;
              }
            }
          } catch {
            // ignore
          }
        } else if (proposal.type === 'TRANSACTION_NOTARIZATION') {
          // Líderes pueden finalizar certificaciones de productos de vendedores en su tribu
          try {
            const order = await this.prisma.productOrder.findUnique({
              where: { id: proposal.proposalId },
              include: { product: { include: { seller: { include: { tribe: true } } } } },
            });
            const sellerTribe = order?.product?.seller?.tribe;
            if (sellerTribe && (sellerTribe.primaryLeaderId === userId || sellerTribe.secondaryLeaderId === userId)) {
              isAuthorized = true;
            }
          } catch {
            // ignore
          }
        }
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException('Only the Elder or the Tribe Leader can finalize this proposal.');
    }

    // Hacer proxy al Notario
    const notaryUrl = process.env.NOTARY_SERVICE_URL || 'http://localhost:3004/api/v1';
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
        signal: AbortSignal.timeout(NOTARY_TIMEOUT_MS),
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
    const notaryUrl = process.env.NOTARY_SERVICE_URL || 'http://localhost:3004/api/v1';
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
        signal: AbortSignal.timeout(NOTARY_TIMEOUT_MS),
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

