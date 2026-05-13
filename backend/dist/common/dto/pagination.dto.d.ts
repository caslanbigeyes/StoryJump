export declare class PaginationDto {
    page?: number;
    limit?: number;
    get skip(): number;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
