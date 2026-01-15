

export interface SurveyResponse {
    questionId: number;
    weight: number;
}

export class RiskService {

    // Calculate normalized score (0-100)
    static calculateScore(responses: SurveyResponse[]): number {
        if (!responses || responses.length === 0) return 0;

        let totalWeight = 0;
        const maxPossibleWeight = responses.length * 5; // Assuming all answered

        responses.forEach(r => {
            totalWeight += r.weight;
        });

        // Normalize to 100
        // Min possible is responses.length * 1.
        // We want 0-100 scale.
        // (Actual - Min) / (Max - Min) * 100
        const minPossible = responses.length * 1;
        const normalized = ((totalWeight - minPossible) / (maxPossibleWeight - minPossible)) * 100;

        return Math.round(normalized);
    }

    static determineRiskClass(score: number): 'Conservative' | 'Moderate' | 'Aggressive' {
        if (score <= 33) return 'Conservative';
        if (score <= 66) return 'Moderate';
        return 'Aggressive';
    }

    // Detect Contradictions
    // Logic: If user chooses weight 1 (Safe) in Q6 and weight 5 (Aggressive) in Q3 -> Contradiction.
    // We check pairs of 'Attitude' vs 'Behavior' or 'Goal'.
    static detectContradictions(responses: SurveyResponse[]): string[] {
        const contradictions: string[] = [];

        // Map qId to weight for easy lookup
        const map = new Map<number, number>();
        responses.forEach(r => map.set(r.questionId, r.weight));

        // Pair 1: Attitude (Q6) vs Goal (Q3)
        // Q6: Attitude (1=Avoid Risk, 5=Seek Max Returns)
        // Q3: Goal (1=Preservation, 5=Aggressive Growth)
        // If Abs(Q6 - Q3) > 2, flag it.
        this.checkPair(map, 6, 3, "Your stated attitude towards risk contradicts your primary investment goal.", contradictions);

        // Pair 2: Reaction (Q7) vs Volatility Comfort (Q12)
        // Q7: Drop 20% (1=Sell, 5=Buy)
        // Q12: Volatility (1=Not comfortable, 5=Thrive)
        this.checkPair(map, 7, 12, "Your reaction to market drops contradicts your stated comfort with volatility.", contradictions);

        // Pair 3: Horizon (Q2) vs Recovery (Q20)
        // Q2: Withdraw Principal (1=<1yr, 5=>10yr)
        // Q20: Wait for recovery (1=Cannot wait, 5=5+yr)
        // If Horizon is Long (5) but Recovery is Short (1) -> Contradiction
        const q2 = map.get(2);
        const q20 = map.get(20);
        if (q2 && q20) {
            if (q2 >= 4 && q20 <= 2) {
                contradictions.push("You plan to invest for the long term but indicated inability to wait for market recovery.");
            }
        }

        return contradictions;
    }

    private static checkPair(map: Map<number, number>, id1: number, id2: number, message: string, list: string[]) {
        const w1 = map.get(id1);
        const w2 = map.get(id2);
        if (w1 !== undefined && w2 !== undefined) {
            if (Math.abs(w1 - w2) >= 3) { // 3 points difference is drastic (1 vs 4, or 1 vs 5, 2 vs 5)
                list.push(message);
            }
        }
    }
}
