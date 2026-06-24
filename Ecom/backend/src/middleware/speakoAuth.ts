import { Request, Response, NextFunction } from 'express';

/**
 * Guards the Speako endpoints that expose session/customer data (cart, orders).
 * Product reads are left public — ElectroTech's catalog is already public — so
 * Speako's connection test and the loader's product sync work without a key.
 *
 * The key is read inside the handler (not at module load) because TypeScript
 * hoists imports above index.ts's dotenv.config(), so a module-level read would
 * capture the value before .env is loaded.
 */
export const authenticateSpeako = (req: Request, res: Response, next: NextFunction) => {
  // The shared secret Speako sends as `Authorization: Bearer <key>`. Must match
  // the `apiKey` in the storefront's window.SpeakoConfig snippet.
  const SPEAKO_API_KEY = process.env.SPEAKO_API_KEY || '';
  const token = req.header('Authorization')?.replace('Bearer ', '').trim();

  if (!SPEAKO_API_KEY) {
    console.error('SPEAKO_API_KEY is not set — refusing Speako request.');
    return res.status(500).json({ message: 'Speako integration is not configured' });
  }

  if (!token || token !== SPEAKO_API_KEY) {
    return res.status(401).json({ message: 'Invalid Speako API key' });
  }

  next();
};
