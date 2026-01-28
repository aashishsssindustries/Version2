
import db from '../config/database';

export interface Goal {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    target_date: Date; // or target_year
    current_amount: number;
    monthly_contribution: number; // SIP allocated
    priority: 'High' | 'Medium' | 'Low';
    created_at: Date;
}

export class GoalModel {
    static async create(goal: Partial<Goal>): Promise<Goal> {
        const {
            user_id, name, target_amount, target_date, current_amount, monthly_contribution, priority
        } = goal;

        const result = await db.query(
            `INSERT INTO goals (user_id, name, target_amount, target_date, current_amount, monthly_contribution, priority)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [user_id, name, target_amount, target_date, current_amount || 0, monthly_contribution || 0, priority || 'Medium']
        );
        return result.rows[0];
    }

    static async findByUserId(userId: string): Promise<Goal[]> {
        const result = await db.query('SELECT * FROM goals WHERE user_id = $1', [userId]);
        return result.rows;
    }

    static async delete(id: string, userId: string) {
        await db.query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [id, userId]);
    }
}
