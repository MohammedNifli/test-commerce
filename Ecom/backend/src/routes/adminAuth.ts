import express from 'express';
import { login } from '../controllers/adminAuthController';

const router = express.Router();

router.post('/login', login);

export default router;
