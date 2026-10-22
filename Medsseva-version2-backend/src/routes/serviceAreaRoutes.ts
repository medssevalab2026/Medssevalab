import { Router } from 'express';
import {
  checkServiceArea,
  createServiceArea,
  deleteServiceArea,
  listServiceAreas,
  syncServiceAreasFromBranches,
  updateServiceArea,
  getGeofencingOverview,
  updatePartnerGeofencing,
} from '../controllers/serviceAreaController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

router.get('/check', checkServiceArea);
router.get('/overview', authenticate, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getGeofencingOverview);
router.get('/', authenticate, authorizeRoles('ADMIN', 'SUPER_ADMIN'), listServiceAreas);
router.post('/', authenticate, authorizeRoles('ADMIN', 'SUPER_ADMIN'), createServiceArea);
router.post('/sync-from-branches', authenticate, authorizeRoles('ADMIN', 'SUPER_ADMIN'), syncServiceAreasFromBranches);
router.patch('/partner-geofencing/:id', authenticate, authorizeRoles('ADMIN', 'SUPER_ADMIN'), updatePartnerGeofencing);
router.put('/partner-geofencing/:id', authenticate, authorizeRoles('ADMIN', 'SUPER_ADMIN'), updatePartnerGeofencing);
router.put('/:id', authenticate, authorizeRoles('ADMIN', 'SUPER_ADMIN'), updateServiceArea);
router.delete('/:id', authenticate, authorizeRoles('ADMIN', 'SUPER_ADMIN'), deleteServiceArea);

export default router;
