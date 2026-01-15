import db from '../config/database';

export interface FinancialProfile {
    id: string;
    user_id: string;
    age: number;
    employment_type?: 'Salaried' | 'Self-employed' | 'Retired';
    gross_income: number;
    monthly_emi: number;
    fixed_expenses: number;
    insurance_premium: number;
    total_liabilities: number;
    existing_assets: number;
    risk_score: number;
    risk_class?: 'Conservative' | 'Moderate' | 'Aggressive';
    health_score: number;
    checklist_status: any;
    persona_data?: any;
    asset_types?: string[];
    insurance_coverage: number;
    action_items?: any[];
    pan_number?: string;
    // Next Best Action fields
    emergency_fund_amount?: number;
    dependents?: number;
    insurance_cover?: number;
    updated_at: Date;
}

export class ProfileModel {
    static async create(profile: Partial<FinancialProfile>): Promise<FinancialProfile> {
        const {
            user_id,
            age,
            employment_type, // New
            gross_income,
            monthly_emi,
            fixed_expenses,
            insurance_premium,
            total_liabilities,
            existing_assets,
            risk_score,
            risk_class,
            health_score,
            persona_data,
            asset_types,
            insurance_coverage,
            action_items,
            pan_number // New
        } = profile;

        const result = await db.query(
            `INSERT INTO profiles (
        user_id, age, employment_type, gross_income, monthly_emi, fixed_expenses, insurance_premium, 
        total_liabilities, existing_assets, risk_score, risk_class, health_score, persona_data, asset_types,
        insurance_coverage, action_items, pan_number, emergency_fund_amount, dependents, insurance_cover
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
            [
                user_id,
                age || 30,
                employment_type || 'Salaried',
                gross_income || 0,
                monthly_emi || 0,
                fixed_expenses || 0,
                insurance_premium || 0,
                total_liabilities || 0,
                existing_assets || 0,
                risk_score || 0,
                risk_class,
                health_score || 0,
                persona_data || {},
                JSON.stringify(asset_types || []),
                insurance_coverage || 0,
                JSON.stringify(action_items || []),
                pan_number,
                profile.emergency_fund_amount || 0,
                profile.dependents || 0,
                profile.insurance_cover || 0
            ]
        );
        return result.rows[0];
    }

    static async findByUserId(userId: string): Promise<FinancialProfile | null> {
        const result = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        return result.rows[0] || null;
    }

    static async update(userId: string, updates: Partial<FinancialProfile>): Promise<FinancialProfile | null> {
        // Construct dynamic update query
        const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'user_id');
        if (fields.length === 0) return null;

        const setClause = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = fields.map(key => {
            const val = (updates as any)[key];
            if (val && typeof val === 'object' && !((val as any) instanceof Date)) {
                return JSON.stringify(val);
            }
            return val;
        });

        const result = await db.query(
            `UPDATE profiles SET ${setClause} WHERE user_id = $1 RETURNING *`,
            [userId, ...values]
        );
        return result.rows[0] || null;
    }
    static async getStats(score: number, personaLabel?: string): Promise<{ percentile: number; count: number }> {
        // Strict Persona-based Benchmarking
        let totalQuery = 'SELECT COUNT(*) FROM profiles';
        let lowerQuery = 'SELECT COUNT(*) FROM profiles WHERE health_score < $1';
        let paramsTotal: any[] = [];
        let paramsLower: any[] = [score];

        if (personaLabel && personaLabel !== 'General') {
            // Use JSONB operator ->> to match label
            totalQuery += ` WHERE persona_data->>'label' = $1`;
            lowerQuery += ` AND persona_data->>'label' = $2`;
            paramsTotal = [personaLabel];
            paramsLower = [score, personaLabel];
        }

        try {
            const totalResult = await db.query(totalQuery, paramsTotal);
            const total = parseInt(totalResult.rows[0].count);

            if (total <= 1) return { percentile: 99, count: 1 }; // User is unique/first

            const lowerResult = await db.query(lowerQuery, paramsLower);
            const lower = parseInt(lowerResult.rows[0].count);

            // Formula: (Lower / Total) * 100
            const percentile = Math.floor((lower / total) * 100);
            return { percentile: percentile > 0 ? percentile : 1, count: total };
        } catch (e) {
            console.error("Percentile Calc Error:", e);
            return { percentile: 50, count: 0 }; // Fail safe
        }
    }

    static async saveActionItems(userId: string, items: any[]) {
        // Clear old items
        await db.query('DELETE FROM action_items WHERE user_id = $1', [userId]);

        if (!items || items.length === 0) return;

        // Bulk Insert
        // items structure: { risk_type, severity, gap, scoreImpact, ... }
        // We map them to DB columns: risk_type, severity, gap_amount, estimated_score_impact

        for (const item of items) {
            await db.query(
                `INSERT INTO action_items 
                 (user_id, risk_type, severity, gap_amount, estimated_score_impact)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    userId,
                    item.type || 'General',
                    item.priority || 'Medium', // Map 'High'/'Medium' etc.
                    item.gap || 0,
                    parseInt(item.scoreImpact?.replace(/\D/g, '') || '0') // Extract Score
                ]
            );
        }
    }

    static async getActionItems(userId: string) {
        const result = await db.query('SELECT * FROM action_items WHERE user_id = $1 ORDER BY severity DESC, estimated_score_impact DESC', [userId]);
        return result.rows;
    }
}
