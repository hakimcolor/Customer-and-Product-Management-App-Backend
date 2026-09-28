import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Return items from a sale — restores stock
export const returnSale = async (req: Request, res: Response): Promise<void> => {
  const saleId = parseInt(req.params.id);
  const { items } = req.body; // [{ saleItemId, quantity }]

  const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } });
  if (!sale) { res.status(404).json({ message: 'Sale not found' }); return; }

  await prisma.$transaction(async (tx) => {
    for (const ret of items) {
      const saleItem = sale.items.find(i => i.id === ret.saleItemId);
      if (!saleItem) continue;
      if (ret.quantity > saleItem.quantity) {
        throw new Error(`Return quantity exceeds sold quantity for item ${ret.saleItemId}`);
      }
      // Restore stock
      await tx.stock.update({
        where: { productId_branchId: { productId: saleItem.productId, branchId: sale.branchId } },
        data: { quantity: { increment: ret.quantity } },
      });
      // Reduce sale item quantity or delete
      if (ret.quantity === saleItem.quantity) {
        await tx.saleItem.delete({ where: { id: saleItem.id } });
      } else {
        await tx.saleItem.update({ where: { id: saleItem.id }, data: { quantity: { decrement: ret.quantity } } });
      }
    }
    // Recalculate sale total
    const remaining = await tx.saleItem.findMany({ where: { saleId } });
    const newTotal = remaining.reduce((sum, i) => sum + i.rate * i.quantity * (1 - i.discount / 100), 0);
    await tx.sale.update({ where: { id: saleId }, data: { totalAmount: newTotal } });
  });

  res.json({ message: 'Sale return processed' });
};

// Return items from a purchase — reduces stock
export const returnPurchase = async (req: Request, res: Response): Promise<void> => {
  const purchaseId = parseInt(req.params.id);
  const { items } = req.body; // [{ purchaseItemId, quantity }]

  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId }, include: { items: true } });
  if (!purchase) { res.status(404).json({ message: 'Purchase not found' }); return; }

  await prisma.$transaction(async (tx) => {
    for (const ret of items) {
      const pItem = purchase.items.find(i => i.id === ret.purchaseItemId);
      if (!pItem) continue;
      if (ret.quantity > pItem.quantity) {
        throw new Error(`Return quantity exceeds purchased quantity for item ${ret.purchaseItemId}`);
      }
      // Reduce stock
      await tx.stock.update({
        where: { productId_branchId: { productId: pItem.productId, branchId: purchase.branchId } },
        data: { quantity: { decrement: ret.quantity } },
      });
      if (ret.quantity === pItem.quantity) {
        await tx.purchaseItem.delete({ where: { id: pItem.id } });
      } else {
        await tx.purchaseItem.update({ where: { id: pItem.id }, data: { quantity: { decrement: ret.quantity } } });
      }
    }
    // Recalculate purchase total
    const remaining = await tx.purchaseItem.findMany({ where: { purchaseId } });
    const newTotal = remaining.reduce((sum, i) => sum + i.rate * i.quantity * (1 - i.discount / 100), 0);
    await tx.purchase.update({ where: { id: purchaseId }, data: { totalAmount: newTotal } });
  });

  res.json({ message: 'Purchase return processed' });
};
