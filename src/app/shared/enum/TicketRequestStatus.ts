export enum TicketRequestStatus {
    Logged = 1,
    Active = 2,
    Assigned = 3,
    InProgress = 4,
    WaitingforCustomer = 5,
    Waitingfor3rdParty = 6,
    WaitingforResolution = 7,
    Resolved = 8,
    Completed = 9,
    Closed = 10,
    OnHold = 11,
    Archived = 12,
}
export enum TicketProblemStatus {
    Logged = 1,
    Investigation = 2,
    Identified = 3,
    Resolved = 4,
    KnownError = 5,
    Completed = 6,
    Closed = 7,
    OnHold = 8,
}
export enum ChangeRequestStatus {
    Logged = 1,
    Requetsed = 2,
    Accepted = 3,
    Rejected = 4,
    Proposed = 5,
    PendingApproval = 6,
    Approved = 7,
    Scheduled = 8,
    Implemented = 9,
    Review = 10,
    Completed = 11,
    Closed = 12,
    OnHold = 13
}