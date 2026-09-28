import { Request } from 'express';

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export const getPagination = (req: Request): PaginationResult => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'))));
  return { skip: (page - 1) * limit, take: limit, page, limit };
};

export const paginatedResponse = (data: unknown[], total: number, page: number, limit: number) => ({
  data,
  meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
});
