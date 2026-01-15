import db from '../config/database';

export interface SurveyResult {
    id: string;
    user_id: string;
    responses: any; // JSONB
    total_score: number;
    final_class: 'Conservative' | 'Moderate' | 'Aggressive';
    created_at: Date;
}

export class SurveyModel {
    static async create(data: Partial<SurveyResult>): Promise<SurveyResult> {
        const { user_id, responses, total_score, final_class } = data;

        const result = await db.query(
            `INSERT INTO survey_responses (user_id, responses, total_score, final_class)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [user_id, JSON.stringify(responses), total_score, final_class]
        );
        return result.rows[0];
    }

    static async findByUserId(userId: string): Promise<SurveyResult[]> {
        const result = await db.query(
            'SELECT * FROM survey_responses WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }
}
