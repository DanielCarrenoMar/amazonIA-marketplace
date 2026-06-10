import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RpcThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    requestProps: any,
  ): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration, generateKey } = requestProps;
    
    if (context.getType() === 'rpc') {
      const client = context.switchToRpc().getContext();
      // Since it's MQTT, we may not have an IP. We can throttle by the client ID or just return true if we don't want to throttle
      // For now, if we want to bypass throttling for MQTT or just use a dummy IP:
      const ip = 'rpc-client'; 
      const key = this.generateKey(context, ip, throttler.name);
      
      const { totalHits, timeToExpire } = await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttler.name
      );

      if (totalHits > limit) {
        throw new ThrottlerException();
      }

      return true;
    }

    return super.handleRequest(requestProps);
  }
}
