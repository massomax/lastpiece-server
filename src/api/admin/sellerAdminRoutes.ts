import { Router } from 'express';
import authenticateJwt from '../../middlewares/authenticateJwt';
import { authorize } from '../../middlewares/authorize';
import {
  listPendingSellers,
  approveSeller,
  rejectSeller
} from './adminSellerController';

const router = Router();

// Все админ-эндпоинты доступны только авторизованным admin-пользователям
router.use(authenticateJwt, authorize('admin'));

// GET /api/v1/admin/sellers/pending
router.get('/pending', listPendingSellers);

// PATCH /api/v1/admin/sellers/:id/approve
router.patch('/:id/approve', approveSeller);

// PATCH /api/v1/admin/sellers/:id/reject
router.patch('/:id/reject', rejectSeller);

export default router;