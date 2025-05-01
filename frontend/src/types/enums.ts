// Defines application-specific enums, particularly those mirroring database CHECK constraints.

export enum SlotStatus {
  Empty = 'empty',
  Live = 'live',
  Maintenance = 'maintenance',
}

export enum DraftStatus {
  Empty = 'empty',
  Drafting = 'drafting',
  ReadyToPublish = 'ready_to_publish',
}

// Add other enums as needed 