export interface NotificationsDto{
    id:number,
    icon: string,
    title: string,
    badge: string,
    text: string,
    time: Date,
    status: string,
    link: string,
    isRead:boolean
    sourceType:string
    sourceId:string,
    taskGroupId:string
  }