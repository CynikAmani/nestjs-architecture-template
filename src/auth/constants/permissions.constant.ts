export const PERMISSIONS = {
    // --- CORE IDENTITY & ACCESS MANAGEMENT (IAM) ---
    USERS: {
      CREATE: 'user:create',
      READ: 'user:read',
      UPDATE: 'user:update',
      DELETE: 'user:delete',
      BLOCK: 'user:block', // Triggers isBlocked toggling
    },
    ROLES: {
      CREATE: 'role:create',
      READ: 'role:read',
      UPDATE: 'role:update',
      DELETE: 'role:delete',
      ASSIGN: 'role:assign', // Managing UserRole mappings
    },
    PERMISSIONS: {
      READ: 'permission:read',
      MANAGE: 'permission:manage', // Linking permissions to roles (RolePermission)
    },
  
    // --- LOAN BUSINESS OPERATIONS ---
    LOAN_APPLICATIONS: {
      CREATE: 'loan-application:create', // Client submission
      READ: 'loan-application:read',     // Internal view
      UPDATE: 'loan-application:update', // Adjusting location, collateral, or discount
      DELETE: 'loan-application:delete',
    },
    LOANS: {
      CREATE: 'loan:create',   // Moving an application into an active loan record
      READ: 'loan:read',       // Viewing active loan portfolios
      UPDATE: 'loan:update',   // Adjusting status, dates, or terms
      CLEAR: 'loan:clear',     // Marking isCleared as true
      DELETE: 'loan:delete',
    },
    PAYMENTS: {
      CREATE: 'payment:create', // Recording an installment (amountPaid)
      READ: 'payment:read',     // Viewing history per loan
      DELETE: 'payment:delete', // Reversing accidental payments
    },
    LOAN_TERMS: {
      MANAGE_RATES: 'loan-term:manage-rates', // Configuring InterestRate per LoanType
      MANAGE_TYPES: 'loan-term:manage-types', // Creating new LoanType entries
    },
  
    // --- SAVINGS BUSINESS OPERATIONS ---
    SAVINGS_APPLICATIONS: {
      CREATE: 'savings-application:create',
      READ: 'savings-application:read',
      UPDATE: 'savings-application:update',
      DELETE: 'savings-application:delete',
    },
    SAVINGS: {
      CREATE: 'saving:create',       // Opening an active saving pool post-approval
      READ: 'saving:read',
      WITHDRAW: 'saving:withdraw',   // Flagging isWithdrawn / dateWithdrawn
      DELETE: 'saving:delete',
    },
    SAVINGS_CONFIG: {
      UPDATE: 'savings-config:update', // Modifying global limits via SavingsAttr
    },
    SAVINGS_AUDIT: {
      READ: 'savings-audit:read', // Reviewing lifecycle shifts (approve_application, etc.)
    },
  
    // --- SUPPORT & COMMUNICATION ---
    FEEDBACK: {
      READ: 'feedback:read',
      DELETE: 'feedback:delete',
      MARK_SEEN: 'feedback:mark-seen', // Toggling isSeen flag
    },
    FEEDBACK_CHATS: {
      CREATE: 'feedback-chat:create', // Sending a response message (chatText)
      READ: 'feedback-chat:read',
    },
    NOTIFICATIONS: {
      CREATE: 'notification:create', // Broadcasting system notifications/messages
      READ: 'notification:read',
      DELETE: 'notification:delete',
    },
  
    // --- COMPLIANCE & CONTENT MANAGEMENT ---
    AGREEMENTS: {
      CREATE: 'agreement:create', // Uploading signature/National ID imagery (AgreementRef)
      READ: 'agreement:read',
    },
    SPECIAL_OFFERS: {
      CREATE: 'special-offer:create',
      READ: 'special-offer:read',
      UPDATE: 'special-offer:update', // Flagging as redeemed
      DELETE: 'special-offer:delete',
    },
    SYSTEM_CONTENT: {
      MANAGE_ABOUT: 'system-content:manage-about',   // Core values, email, phone info
      MANAGE_ADVERTS: 'system-content:manage-adverts', // Image and rich text layout
      MANAGE_BRAND: 'system-content:manage-brand',     // Global brand assets
      MANAGE_TNC: 'system-content:manage-tnc',         // Updating T&C legal versions
    },
  } as const;
  
  // Deep TypeScript extraction logic for complete compile-time type safety
  export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];
  
  // Dynamic flattening mechanism built for programmatic database seeding
  export const ALL_PERMISSIONS_ARRAY: string[] = Object.values(PERMISSIONS).flatMap(
    (entityObj) => Object.values(entityObj)
  );