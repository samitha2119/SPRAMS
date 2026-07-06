const express = require('express');
const router = express.Router();
const {
    getEvaluations,
    getEvaluation,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
} = require('../../controllers/admin/evaluations');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router.route('/')
    .get(getEvaluations)
    .post(authorize('admin', 'lecturer'), createEvaluation);

router.route('/:id')
    .get(getEvaluation)
    .put(authorize('admin', 'lecturer'), updateEvaluation)
    .delete(authorize('admin'), deleteEvaluation);

module.exports = router;
