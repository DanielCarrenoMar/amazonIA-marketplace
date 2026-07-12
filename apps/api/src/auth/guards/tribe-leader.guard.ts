import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { TRIBE_LEADER_KEY, PRIMARY_LEADER_ONLY_KEY } from '../decorators/tribe-leader.decorator';

@Injectable()
export class TribeLeaderGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isTribeLeaderRequired = this.reflector.getAllAndOverride<boolean>(TRIBE_LEADER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isPrimaryOnlyRequired = this.reflector.getAllAndOverride<boolean>(PRIMARY_LEADER_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isTribeLeaderRequired && !isPrimaryOnlyRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // We expect the tribe ID to be passed as a param named either 'tribeId' or 'id'
    const tribeIdStr = request.params.tribeId || request.params.id;
    if (!tribeIdStr) {
      throw new ForbiddenException('Tribe ID parameter is missing');
    }

    const tribeId = parseInt(tribeIdStr, 10);
    if (isNaN(tribeId)) {
      throw new ForbiddenException('Invalid Tribe ID format');
    }

    const tribe = await this.prisma.tribe.findUnique({
      where: { id: tribeId },
      select: { primaryLeaderId: true, secondaryLeaderId: true },
    });

    if (!tribe) {
      throw new ForbiddenException('Tribe not found');
    }

    const isPrimary = tribe.primaryLeaderId === user.id;
    const isSecondary = tribe.secondaryLeaderId === user.id;

    if (isPrimaryOnlyRequired && !isPrimary) {
      throw new ForbiddenException('Solo el líder primario puede realizar esta acción');
    }

    if (isTribeLeaderRequired && !isPrimary && !isSecondary) {
      throw new ForbiddenException('Solo un líder de la tribu puede realizar esta acción');
    }

    // Attach leader context to the request for the controller
    request.tribeLeaderType = isPrimary ? 'PRIMARY' : (isSecondary ? 'SECONDARY' : null);

    return true;
  }
}
