import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  toggleBlockUser,
  deleteUser,
  adjustUserBalance,
  getUserBalanceHistory,
} from '../controllers/users.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT, requireAdmin);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.patch('/:id/block', toggleBlockUser);
router.delete('/:id', deleteUser);

// Balance management by Admin
router.post('/:id/balance', adjustUserBalance);
router.get('/:id/balance-history', getUserBalanceHistory);

export default router;
