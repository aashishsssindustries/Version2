
import { Request, Response } from 'express';
import { GoalModel } from '../models/goal.model';
import { HealthService } from '../services/health.service';

export class GoalController {
    static async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const goalData = { ...req.body, user_id: userId };

            const goal = await GoalModel.create(goalData);

            // Trigger score update
            await HealthService.recalculate(userId);

            res.json({ success: true, data: goal });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getAll(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const goals = await GoalModel.findByUserId(userId);
            res.json({ success: true, data: goals });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            await GoalModel.delete(id, userId);

            // Trigger score update
            await HealthService.recalculate(userId);

            res.json({ success: true, message: 'Goal deleted' });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
