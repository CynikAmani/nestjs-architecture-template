import { Prisma } from '@prisma/client';

export const userRolesWithPermissionsInclude = {
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithRolesAndPermissions = Prisma.UserGetPayload<{
  include: typeof userRolesWithPermissionsInclude;
}>;

export function extractRoleNames(user: UserWithRolesAndPermissions): string[] {
  return user.userRoles.map((userRole) => userRole.role.name);
}

export function extractPermissionNames(
  user: UserWithRolesAndPermissions,
): string[] {
  const permissionNames = user.userRoles.flatMap((userRole) =>
    userRole.role.rolePermissions.map(
      (rolePermission) => rolePermission.permission.name,
    ),
  );

  return [...new Set(permissionNames)];
}
