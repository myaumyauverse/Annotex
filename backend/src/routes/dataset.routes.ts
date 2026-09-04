import { Router } from 'express';
import { body, param } from 'express-validator';
import { DatasetController } from '../controllers/dataset.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { validate } from '../middlewares/validation.js';
import { UserRole } from '../types/index.js';

const router = Router();
const datasetController = new DatasetController();

/**
 * @swagger
 * /datasets:
 *   get:
 *     summary: Get all datasets
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of datasets
 */
router.get('/', authenticate, datasetController.getAllDatasets);

/**
 * @swagger
 * /datasets:
 *   post:
 *     summary: Upload a new dataset (Admin only)
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - file
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Dataset uploaded successfully
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.VALIDATOR),
  upload.single('file'),
  validate([
    body('name').trim().notEmpty().isLength({ max: 255 }),
    body('description').optional().trim(),
    body('labelType').optional().isIn(['text', 'category', 'multi-select']),
    body('totalRewardSOL').optional().isFloat({ min: 0 }),
    body('maxLabelsPerRecord').optional().isInt({ min: 1, max: 10 }),
    body('consensusThreshold').optional().isFloat({ min: 0.5, max: 1.0 }),
  ]),
  datasetController.uploadDataset
);

router.post(
  '/:id/publish',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.VALIDATOR),
  validate([
    param('id').isUUID(),
    body('batchSize').optional().isInt({ min: 1 }),
  ]),
  datasetController.publishDataset
);

/**
 * @swagger
 * /datasets/{id}:
 *   get:
 *     summary: Get dataset by ID
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dataset details
 */
router.get(
  '/:id',
  authenticate,
  validate([param('id').isUUID()]),
  datasetController.getDatasetById
);

/**
 * @swagger
 * /datasets/{id}:
 *   delete:
 *     summary: Delete dataset (Admin only)
 *     tags: [Datasets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dataset deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate([param('id').isUUID()]),
  datasetController.deleteDataset
);

export default router;
