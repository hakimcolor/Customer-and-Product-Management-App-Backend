import { Request } from 'express';

export interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export const getPagination = (req: Request): PaginationParams => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'))));
  return { skip: (page - 1) * limit, take: limit, page, limit };
};

export const paginate = <T>(data: T[], total: number, page: number, limit: number) => ({
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
});
