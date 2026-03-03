export interface ChecklistItem {
    doc: string;
    required: boolean;
    priority: string;
}

export interface Bank {
    name: string;
    distance_meters: number;
    formatted_address: string;
    lat: number;
    lon: number;
    pmvl_prioritized: boolean;
    interest_rate_2026: number;
    tier: string;
    maps_url: string;
    document_checklist: ChecklistItem[];
}

export interface RepaymentPeriod {

    month: number;
    principal: number;
    interest: number;
    payment: number;
    remaining_balance: number;
}

export interface University {

    id: number;
    aishe_code: string;
    name: string;
    state: string;
    type: string;
    is_qhei: boolean;
    pmvl_category: string;
    total_course_fee: number;
    avg_placement_lpa: number;
    roi_index: number;
    base_interest_rate: number;
    latitude?: number;
    longitude?: number;
}

export interface ForeignUniv {
    id: number;
    name: string;
    country: string;
    currency: string;
    avg_tuition_annual: number;
}

export interface SimulationResult {
    emi: number;
    total_interest: number;
    moratorium_interest: number;
    capitalized_principal: number;
    effective_rate: number;
    subsidy_status: string;
    csis_eligible: boolean;
    vidyalaxmi_eligible: boolean;
    tax_benefit_80E: number;
    months_saved: number;
    tcs_amount: number;
    tcs_details: string;
    total_interest_paid?: number;
    tenure_years?: number;
    repayment_schedule?: RepaymentPeriod[];


    recommendations?: { strategy: string; impact: string; description: string }[];
    sustainability_data?: {
        health_score: number;
        risk_status: string;
        placement_probability: number;
        inflation_adjustment_factor: number;
        market_momentum: number;
        tier_2026: string;
        interest_savings?: number;
        tenure_reduction_years?: number;
        strategies?: Record<string, { savings: number; reduction: number }>;
        gig_work_target?: number;
        recommendations?: string[];
    };
}
