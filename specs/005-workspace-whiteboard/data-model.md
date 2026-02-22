# Whiteboard Data Model

## Firestore Collections

### Collection: `workspaces/{workspaceId}/board`
This is a singleton subcollection containing exactly one document per workspace representing the current state of the whiteboard.

#### Document: `state`
- `elements` (Array of ExcalidrawElement objects): The core drawing vectors (shapes, text, freehand lines). Stored as a raw serialized JSON array from Excalidraw.
- `appState` (Object): The user's specific viewport layout (zoom level, scroll X/Y, current background color, active grid settings). Stored as a raw serialized JSON object from Excalidraw. (Omit ephemeral states like `collaborators` or `isCollaborating`).
- `files` (Object): Map of media/image files embedded in the drawing (Optional/if applicable based on Excalidraw config, typically empty for simple whiteboards but structurally required by Excalidraw's format).
- `lastUpdated` (Timestamp): Server timestamp of the last debounced auto-save.

## Client-Side State Transitions
1. **Initial Load**:
   - Status: `loading`
   - UI: `<Skeleton className="w-full h-full" />`
   - Action: Fetch `workspaces/{workspaceId}/board/state`.
2. **Ready (Data Exists)**:
   - Status: `ready`
   - UI: Excalidraw Canvas
   - Action: Pass fetched `elements` and `appState` into Excalidraw's `initialData` binding.
3. **Ready (No Data / New Board)**:
   - Status: `ready`
   - UI: Empty Excalidraw Canvas
   - Action: Pass empty arrays to Excalidraw. Do NOT write an empty document to Firestore until the user actually draws something to save reads/writes.
4. **Drawing (Auto-Save Active)**:
   - Event: `onChange` fired by Excalidraw.
   - Action: Fire debouncer (reset 2000ms timer).
5. **Debounce Triggered**:
   - Action: Write current `elements` and relevant `appState` to Firestore document using `setDoc(..., { merge: true })`.
