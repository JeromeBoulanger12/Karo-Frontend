// Shape of a distribution plan rule as returned by GET /jobs/plans
export interface DistributionRule {
  envelopeId: string
  envelopeName: string
  allocationType: 'FixedAmount' | 'Percentage' | 'BillProrated' | 'GoalProrated' | 'Automatic'
  fixedAmount?: { amount: number; currency: string } | null
  percentageValue?: number | null
}

type Money = { amount: number; currency: string }

// GET /jobs/plans/{id}/paycheck-preview: what the next paycheck puts in each envelope (one line per rule,
// in the plan's rule order), the total taken and what is left. Paid plans only.
export interface PaycheckPreview {
  payDate: string
  paycheckAmount: Money | null
  lines: { envelopeId: string; envelopeName: string; allocationType: DistributionRule['allocationType']; amount: Money }[]
  total: Money
  surplus: Money | null
}

export const formatRuleAmount = (rule: DistributionRule) => {
  switch (rule.allocationType) {
    case 'FixedAmount':
      return new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency: rule.fixedAmount?.currency || 'CAD'
      }).format(rule.fixedAmount?.amount ?? 0)
    case 'Percentage':
      return `${rule.percentageValue ?? 0} %`
    default:
      return 'Calculé automatiquement'
  }
}
