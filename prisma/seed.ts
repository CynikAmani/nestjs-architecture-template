import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { GENDERS, MALAWI_DISTRICTS } from './data/system-initial-data/reference-data';
import { ALL_PERMISSIONS_ARRAY } from '../src/auth/constants/permissions.constant';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set in .env');
}

// Highly reliable Postgres driver adapter configuration
const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function seedGenders(): Promise<void> {
  console.log(`🧬 Seeding ${GENDERS.length} genders...`);

  for (const gender of GENDERS) {
    const existing = await prisma.gender.findFirst({ where: { gender } });
    if (!existing) {
      await prisma.gender.create({ data: { gender } });
    }
  }
}

async function seedDistricts(): Promise<void> {
  console.log(`📍 Seeding ${MALAWI_DISTRICTS.length} Malawi districts...`);

  for (const districtName of MALAWI_DISTRICTS) {
    const existing = await prisma.district.findFirst({ where: { districtName } });
    if (!existing) {
      await prisma.district.create({ data: { districtName } });
    }
  }
}

async function main() {
  console.log('🚀 Starting corporate database seeding pipeline (PostgreSQL)...');

  // -------------------------------------------------------------
  // 1. Seed Reference Data (genders, districts)
  // -------------------------------------------------------------
  await seedGenders();
  await seedDistricts();

  // -------------------------------------------------------------
  // 2. Seed All Atomic Permissions
  // -------------------------------------------------------------
  console.log(`📦 Synchronizing ${ALL_PERMISSIONS_ARRAY.length} permissions...`);

  for (const permissionName of ALL_PERMISSIONS_ARRAY) {
    await prisma.permission.upsert({
      where: { name: permissionName },
      update: {},
      create: {
        name: permissionName,
        description: `Allows atomic action: ${permissionName.replace(':', ' ')}`,
      },
    });
  }

  // -------------------------------------------------------------
  // 3. Create or Update Super Admin Role
  // -------------------------------------------------------------
  console.log('👑 Configuring Super Admin Role...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Root system administrator with global infrastructure capabilities.',
    },
  });

  // -------------------------------------------------------------
  // 4. Bind ALL Permissions to Super Admin Role
  // -------------------------------------------------------------
  console.log('⛓️  Mapping all atomic permissions to Super Admin role...');

  const dbPermissions = await prisma.permission.findMany();

  for (const perm of dbPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.roleId,
          permissionId: perm.permissionId,
        },
      },
      update: {},
      create: {
        roleId: adminRole.roleId,
        permissionId: perm.permissionId,
      },
    });
  }

  // -------------------------------------------------------------
  // 5. Provision Default Admin User with Dynamic Hashing
  // -------------------------------------------------------------
  console.log('👤 Provisioning infrastructure Master Administrator...');

  const adminUserId = 'sudo@xandercreditors.com';
  
  // Google Level Practice: Pull default credentials out of environment contexts
  const rawAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Xander2026!';
  
  // Dynamically hash the password using 12 salt rounds on execution
  const dynamicSecureHash = await bcrypt.hash(rawAdminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { userId: adminUserId },
    update: {
      password: dynamicSecureHash, // Keeps password updated if changed in env config
    },
    create: {
      userId: adminUserId,
      password: dynamicSecureHash,
      fullname: 'System Master Administrator',
      nationalId: 'NAT-999-000-111',
      email: 'admin@platform.com',
      phone: '+10000000000',
    },
  });

  // -------------------------------------------------------------
  // 6. Attach Super Admin Role to Default User
  // -------------------------------------------------------------
  console.log('🔑 Granting Super Admin role assignment to user...');
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.userId,
        roleId: adminRole.roleId,
      },
    },
    update: {},
    create: {
      userId: adminUser.userId,
      roleId: adminRole.roleId,
    },
  });

  console.log('✅ Seeding pipeline completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Critical failure running database seed pipeline:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Cleanly close the Postgres pool worker threads
  });