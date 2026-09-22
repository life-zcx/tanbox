import { Router } from 'express';
import { calculatePrice } from '../controllers/calculator.controller';

const router = Router();

router.post('/calculate', calculatePrice);

export default router;
