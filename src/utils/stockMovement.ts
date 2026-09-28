import { Prisma } from '@prisma/client';

type TxClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

type MovementType =
  | 'SALE'
  | 'SALE_RETURN'
  | 'PURCHASE'
  | 'PURCHASE_RETURN'
  | 'ADJUSTMENT'
  | 'DAMAGE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'OPENING';

export const recordStockMovement = async (
  tx: TxClient,
  opts: {
    productId: number;
    branchId: number;
    type: MovementType;
    quantity: number; // positive = in, negative = out
    before: number;
    refType?: string;
    refId?: number;
    notes?: string;
  }
) => {
  return tx.stockMovement.create({
    data: {
      productId: opts.productId,
      branchId: opts.branchId,
      type: opts.type,
      quantity: opts.quantity,
      before: opts.before,
      after: opts.before + opts.quantity,
      refType: opts.refType,
      refId: opts.refId,
      notes: opts.notes,
    },
  });
};
