# Data Model: Phase 6 - Workspace Sharing

This document outlines the changes to the Firestore data model required to support Workspace Sharing functionality.

## `workspaces` Collection Update

The existing `workspaces` collection will be updated to support an explicitly defined ownership and membership model.

### Modified Document Structure

```typescript
interface Workspace {
  id: string; // The unique document ID
  name: string; // The display name of the workspace
  createdAt: Timestamp; // When the workspace was created
  
  // NEW FIELDS
  ownerId: string; // The UID of the user who created and owns the workspace.
  // ownerId has full administrative rights (Create/Read/Update/Delete).
  
  memberIds: string[]; // Array of UIDs representing users who have joined the workspace.
  // memberIds have read-only access to all subjects, lectures, and resources within the workspace.
}
```

### Access Control Rules (Conceptual)

Database security rules must enforce the new ownership model:

1. **Read Access**: A user can read a `workspace` document (and its subcollections like `subjects` and `lectures`) IF `request.auth.uid == resource.data.ownerId` OR `request.auth.uid in resource.data.memberIds`.
2. **Write Access (Create/Update/Delete)**: A user can write to a `workspace` document (or its subcollections) ONLY IF `request.auth.uid == resource.data.ownerId`.
3. **Join Access (Special Update)**: A user can append their own UID to the `memberIds` array using an `arrayUnion` operation during the join flow, provided they are authenticated.

### Migration Strategy

For existing workspaces created before this phase:
- A migration script or a fallback logic constraint will need to be implemented to set the original creator's UID as the `ownerId` and initialize an empty `memberIds` array for all existing `workspaces` documents.
