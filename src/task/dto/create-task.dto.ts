export class CreateTaskDto {
    title?: string;
    description?: string;
    status?: string;
    points?: number;
    inclusiveDate?: Date;
    dueDate?: Date;
    priority?: number;
    userId?: number;
    updatedAt?: Date;
}