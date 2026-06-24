import { Request, Response } from 'express';
import prisma from '../prisma';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const fetchAll = req.query.all === 'true';

    if (fetchAll) {
      const [products, total] = await Promise.all([
        prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.product.count(),
      ]);
      return res.json({ products, totalPages: 1, currentPage: 1, totalCount: total });
    }

    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip  = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.product.count(),
    ]);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalCount: total,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, category } = req.body;
    let imageUrl = null;

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        category,
        imageUrl,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // A product referenced by an order can't be hard-deleted (FK constraint) and
    // deleting it would corrupt that order's history. Block it with a clear reason.
    const orderRefs = await prisma.orderItem.count({ where: { productId: id } });
    if (orderRefs > 0) {
      return res.status(409).json({
        message: `Cannot delete — this product belongs to ${orderRefs} existing order${orderRefs !== 1 ? 's' : ''}.`,
      });
    }

    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
};

export const bulkDeleteProducts = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids?: unknown };

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Provide a non-empty "ids" array' });
    }
    const validIds = ids.filter((id): id is string => typeof id === 'string');
    if (validIds.length === 0) {
      return res.status(400).json({ message: 'No valid product ids provided' });
    }

    // Products referenced by an order cannot be hard-deleted (FK constraint).
    // Skip those and report them so the bulk action still removes the rest.
    const referenced = await prisma.orderItem.findMany({
      where: { productId: { in: validIds } },
      select: { productId: true },
      distinct: ['productId'],
    });
    const blockedIds = new Set(referenced.map((r) => r.productId));
    const deletableIds = validIds.filter((id) => !blockedIds.has(id));

    const result = deletableIds.length
      ? await prisma.product.deleteMany({ where: { id: { in: deletableIds } } })
      : { count: 0 };

    res.json({
      message: `Deleted ${result.count} product${result.count !== 1 ? 's' : ''}`,
      deleted: result.count,
      skipped: blockedIds.size,
      skippedIds: [...blockedIds],
    });
  } catch (error) {
    console.error('Error bulk deleting products:', error);
    res.status(500).json({ message: 'Error deleting products' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, description, price, stock, category } = req.body;

    const updateData: any = {
      name: name as string | undefined,
      description: description as string | undefined,
      price: price ? parseFloat(price as string) : undefined,
      stock: stock ? parseInt(stock as string, 10) : undefined,
      category: category as string | undefined,
    };

    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
};

interface ProductRow {
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  imageUrl: string | null;
}

function parseProductRow(
  raw: Record<string, string>,
  rowNum: number
): { product: ProductRow | null; error?: string } {
  const name = (raw.name || '').trim();
  const priceStr = (raw.price || '').trim();

  if (!name) {
    return { product: null, error: `Row ${rowNum}: missing required field "name"` };
  }
  if (!priceStr) {
    return { product: null, error: `Row ${rowNum}: missing required field "price"` };
  }

  const price = parseFloat(priceStr);
  if (isNaN(price)) {
    return { product: null, error: `Row ${rowNum}: invalid price "${priceStr}"` };
  }

  const stockRaw = (raw.stock || '0').trim();
  const stock = parseInt(stockRaw, 10);

  return {
    product: {
      name,
      description: raw.description?.trim() || null,
      price,
      stock: isNaN(stock) ? 0 : stock,
      category: raw.category?.trim() || null,
      imageUrl: (raw.imageurl || raw.imageUrl || '').trim() || null,
    },
  };
}

function normalizeKeys(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.toLowerCase().trim()] = String(v ?? '');
  }
  return out;
}

export const bulkUploadProducts = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const results: ProductRow[] = [];
  const errors: string[] = [];

  const cleanup = () => {
    try {
      if (fs.existsSync(req.file!.path)) fs.unlinkSync(req.file!.path);
    } catch {
      // ignore cleanup errors
    }
  };

  try {
    if (ext === '.csv') {
      await new Promise<void>((resolve, reject) => {
        let rowNum = 1;
        fs.createReadStream(req.file!.path)
          .pipe(csvParser({ mapHeaders: ({ header }) => header.toLowerCase().trim() }))
          .on('data', (data: Record<string, string>) => {
            rowNum++;
            const { product, error } = parseProductRow(data, rowNum);
            if (error) {
              errors.push(error);
            } else if (product) {
              results.push(product);
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      rows.forEach((rawRow, i) => {
        const row = normalizeKeys(rawRow);
        const { product, error } = parseProductRow(row, i + 2);
        if (error) {
          errors.push(error);
        } else if (product) {
          results.push(product);
        }
      });
    } else {
      cleanup();
      return res.status(400).json({
        message: 'Unsupported file type. Please upload a .csv, .xlsx, or .xls file.',
      });
    }

    if (results.length > 0) {
      await prisma.product.createMany({ data: results, skipDuplicates: true });
    }

    cleanup();
    res.json({
      message: `Processed ${results.length + errors.length} rows — inserted: ${results.length}, errors: ${errors.length}`,
      inserted: results.length,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    cleanup();
    console.error('Error bulk uploading products:', error);
    res.status(500).json({ message: 'Error processing file. Please check the file format.' });
  }
};
