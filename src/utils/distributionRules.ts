// Shape of a distribution plan rule as returned by GET /jobs/plans
export interface DistributionRule {
  envelopeId: string
  envelopeName: string
  allocationType: 'FixedAmount' | 'Percentage' | 'BillProrated' | 'Automatic'
  fixedAmount?: { amount: number; currency: string } | null
  percentageValue?: number | null
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
