import { SetMetadata } from '@nestjs/common';

export const TRIBE_LEADER_KEY = 'tribe_leader';
export const TribeLeader = () => SetMetadata(TRIBE_LEADER_KEY, true);

export const PRIMARY_LEADER_ONLY_KEY = 'primary_leader_only';
export const PrimaryLeaderOnly = () => SetMetadata(PRIMARY_LEADER_ONLY_KEY, true);
