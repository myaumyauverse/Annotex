# Role-Based Access Control (RBAC) Guide

This guide explains how to implement role-aware UI behavior in the Annotex frontend. The system supports three roles: **Admin**, **Validator**, and **Contributor**.

## Overview

The RBAC system provides utilities and components to conditionally show/hide UI elements based on the logged-in user's role and permissions.

### Roles & Permissions

#### Admin

- Full platform access
- Manage datasets and tasks
- Review and approve labels
- Trigger cryptocurrency payouts
- View platform analytics
- Manage contributor accounts

#### Validator

- Review submitted labels
- Approve or reject quality work
- View task-specific metrics
- Monitor quality indicators

#### Contributor

- Browse available tasks
- Submit labels for tasks
- View personal performance metrics
- Connect crypto wallets
- View earnings history

---

## API Reference

### 1. Utility Functions (`lib/role-utils.ts`)

#### Permission Checking

```typescript
import { hasPermission, isAdmin, isContributor } from "@/lib/role-utils";

// Check specific permission
hasPermission(role, "create_task") // => boolean

// Check if admin
isAdmin(user?.role) // => boolean

// Check if contributor
isContributor(user?.role) // => boolean

// Check if validator
isValidator(user?.role) // => boolean
```

#### Specific Checks

```typescript
import {
  canCreateTasks,
  canSubmitLabels,
  canApproveLabels,
  canManagePayouts,
  canViewAnalytics,
} from "@/lib/role-utils";

canCreateTasks(user?.role)          // Admin only
canSubmitLabels(user?.role)         // Contributor & Validator
canApproveLabels(user?.role)        // Admin & Validator
canManagePayouts(user?.role)        // Admin only
canViewAnalytics(user?.role)        // All roles
```

#### Display Utilities

```typescript
import { getRoleDisplayName, getRoleBadgeColor } from "@/lib/role-utils";

// Get user-friendly name
getRoleDisplayName("admin") // => "Administrator"

// Get Tailwind color classes
getRoleBadgeColor("admin")  // => "bg-red-100 text-red-800 border-red-300"
```

---

### 2. RBAC Components (`components/rbac/`)

#### AdminOnly Component

Show content only to admin users:

```tsx
import { AdminOnly } from "@/components/rbac";

<AdminOnly role={user?.role}>
  <button onClick={createTask}>Create Task</button>
</AdminOnly>
```

#### ContributorOnly Component

Show content only to contributors:

```tsx
import { ContributorOnly } from "@/components/rbac";

<ContributorOnly role={user?.role}>
  <form onSubmit={submitLabel}>
    {/* Label submission form */}
  </form>
</ContributorOnly>
```

#### ValidatorOnly Component

Show content only to validators:

```tsx
import { ValidatorOnly } from "@/components/rbac";

<ValidatorOnly role={user?.role}>
  <div>Label review queue</div>
</ValidatorOnly>
```

#### RequirePermission Component

Check for specific permission:

```tsx
import { RequirePermission } from "@/components/rbac";

<RequirePermission permission="trigger_payouts" role={user?.role}>
  <button onClick={processPayout}>Process Payout</button>
</RequirePermission>

// With fallback UI
<RequirePermission 
  permission="trigger_payouts" 
  role={user?.role}
  fallback={<p>You don't have permission to process payouts</p>}
>
  <button onClick={processPayout}>Process Payout</button>
</RequirePermission>
```

#### RoleBasedContent Component

Render different content per role:

```tsx
import { RoleBasedContent } from "@/components/rbac";

<RoleBasedContent
  role={user?.role}
  admin={<AdminDashboard />}
  validator={<ValidatorHub />}
  contributor={<ContributorWorkspace />}
  default={<LoadingSpinner />}
/>
```

---

### 3. usePermissions Hook

Access permissions in components:

```tsx
import { usePermissions } from "@/components/rbac/use-permissions";

export function MyComponent() {
  const { 
    isAdmin, 
    canCreateTasks, 
    canSubmitLabels,
    role 
  } = usePermissions();

  return (
    <div>
      {isAdmin() && <AdminControls />}
      {canSubmitLabels() && <LabelForm />}
      Current role: {role}
    </div>
  );
}
```

---

### 4. Role Badge Component

Display user role visually:

```tsx
import { RoleBadge, RoleIndicator } from "@/components/rbac/role-badge";

// Display role badge
<RoleBadge role={user?.role} size="md" />

// Display role icon
<RoleIndicator role={user?.role} />
```

**Badge Sizes:** `sm` | `md` | `lg`

**Colors:**

- Admin: Red badge
- Validator: Purple badge
- Contributor: Blue badge

---

## Usage Examples

### Example 1: Admin Task Creation

```tsx
import { AdminOnly } from "@/components/rbac";
import { useAuth } from "@/components/providers/auth-provider";

export function TaskManagement() {
  const { user } = useAuth();

  return (
    <section>
      <AdminOnly role={user?.role}>
        <form onSubmit={createTask}>
          <input placeholder="Task title" />
          <textarea placeholder="Description" />
          <input type="number" placeholder="Reward" />
          <button type="submit">Create Task</button>
        </form>
      </AdminOnly>

      <AdminOnly role={user?.role} fallback={
        <p>Only administrators can create tasks.</p>
      }>
        {/* Form above */}
      </AdminOnly>
    </section>
  );
}
```

### Example 2: Conditional Navigation

```tsx
import { usePermissions } from "@/components/rbac/use-permissions";

export function Navigation() {
  const { isAdmin, isValidator, isContributor } = usePermissions();

  return (
    <nav>
      {isAdmin() && <Link href="/dashboard/tasks">Manage Tasks</Link>}
      {isAdmin() && <Link href="/dashboard/payouts">Payouts</Link>}
      
      {isValidator() && <Link href="/dashboard/review">Review Labels</Link>}
      
      {isContributor() && <Link href="/dashboard/my-labels">My Submissions</Link>}
      {isContributor() && <Link href="/dashboard/earnings">Earnings</Link>}
    </nav>
  );
}
```

### Example 3: Permission-Based Button State

```tsx
import { RequirePermission } from "@/components/rbac";
import { usePermissions } from "@/components/rbac/use-permissions";

export function PayoutButton() {
  const { canManagePayouts } = usePermissions();

  return (
    <RequirePermission 
      permission="trigger_payouts" 
      role={useAuth().user?.role}
      fallback={
        <button disabled title="Admin only">
          Process Payout
        </button>
      }
    >
      <button onClick={handlePayout}>
        Process Payout
      </button>
    </RequirePermission>
  );
}
```

### Example 4: Multi-Role Component

```tsx
import { RoleBasedContent } from "@/components/rbac";

export function DashboardHeader() {
  const { user } = useAuth();

  return (
    <RoleBasedContent
      role={user?.role}
      admin={
        <header>
          <h1>Admin Dashboard</h1>
          <p>Manage tasks, contributors, and payouts</p>
        </header>
      }
      validator={
        <header>
          <h1>Validator Hub</h1>
          <p>Review quality and approve labels</p>
        </header>
      }
      contributor={
        <header>
          <h1>Contributor Workspace</h1>
          <p>Complete tasks and earn crypto</p>
        </header>
      }
    />
  );
}
```

---

## Permission Matrix

| Feature | Admin | Validator | Contributor |
|---------|-------|-----------|-------------|
| View Dashboard | ✓ | ✓ | ✓ |
| Create Tasks | ✓ | ✗ | ✗ |
| Assign Tasks | ✓ | ✗ | ✗ |
| Submit Labels | ✗ | ✗ | ✓ |
| Approve Labels | ✓ | ✓ | ✗ |
| Reject Labels | ✓ | ✓ | ✗ |
| View Analytics | ✓ | ✓ | ✓* |
| Trigger Payouts | ✓ | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ |
| Connect Wallet | ✗ | ✗ | ✓ |
| View Earnings | ✗ | ✗ | ✓ |

*Contributor can view personal analytics only

---

## Integration with NextAuth

The role is extracted from the user session managed by NextAuth:

```tsx
import { useSession } from "next-auth/react";

const { data: session } = useSession();
const userRole = session?.user?.role; // "admin" | "validator" | "contributor"
```

The `useAuth()` hook provides easy access:

```tsx
import { useAuth } from "@/components/providers/auth-provider";

const { user } = useAuth();
console.log(user?.role); // Current user's role
```

---

## Best Practices

1. **Always check role before showing sensitive actions**

   ```tsx
   {canManagePayouts(user?.role) && <PayoutPanel />}
   ```

2. **Use specific permission checks for granular control**

   ```tsx
   {hasPermission(user?.role, "delete_task") && <DeleteButton />}
   ```

3. **Combine with backend authorization**

   ```tsx
   // Frontend RBAC shows/hides UI
   // Backend validation ensures security
   const response = await fetch("/tasks", {
     method: "POST",
     headers: { Authorization: `Bearer ${accessToken}` }
   });
   ```

4. **Provide fallback UI for restricted actions**

   ```tsx
   <AdminOnly role={user?.role} fallback={<UpgradePrompt />}>
     <AdminFeature />
   </AdminOnly>
   ```

5. **Use role badges consistently throughout the UI**

   ```tsx
   <div className="flex items-center gap-2">
     <RoleIndicator role={user?.role} />
     <RoleBadge role={user?.role} size="md" />
   </div>
   ```

---

## Testing Role-Based Features

To test different roles locally:

1. **Register as each role type:**
   - Admin: `role: "admin"` (during registration flow)
   - Validator: `role: "validator"`
   - Contributor: `role: "contributor"` (default)

2. **Inspect in browser DevTools:**
   - Check session in `next-auth` callback
   - Verify role in Redux/Context store
   - Inspect JWT token claims

3. **Verify backend authorization:**
   - Ensure API endpoints check role
   - Confirm 403 Forbidden for unauthorized roles
   - Test token validation

---

## Future Enhancements

- [ ] Role-based page transitions with warnings
- [ ] Feature flags based on roles
- [ ] Dynamic permission loading from backend
- [ ] Role change notifications
- [ ] Audit logging for role-based actions
