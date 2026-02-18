// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/users/enums/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: [Role, ...Role[]]) => SetMetadata(ROLES_KEY, roles);