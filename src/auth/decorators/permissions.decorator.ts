import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { PermissionType } from '../constants/permissions.constant';

export const PERMISSIONS_METADATA_KEY = 'permission';

/**
 * Secures a route by requiring a single, explicit atomic permission string.
 * @param permission The required atomic permission value (e.g., PERMISSIONS.LOAN_APPLICATIONS.CREATE)
 */
export function RequirePermission(permission: PermissionType): CustomDecorator<string> {
  return SetMetadata(PERMISSIONS_METADATA_KEY, permission);
}