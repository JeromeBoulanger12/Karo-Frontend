// A bill that is due before the end of the month, with what is still missing from its envelope
export interface BillCoverage {
  name: string
  target: number
  balance: number
  dueDate: Date
}

export interface MonthEndInput {
  // Sum of each account's surplus (balance minus its envelopes), already net of funded bills
  surplus: number
  // Expected income per month (the same forecast shown on the dashboard)
  monthlyIncome: number
  today: Date
  bills: BillCoverage[]
}

export interface UnfundedBill {
  name: string
  amount: number
  dueDate: Date
}

export interface MonthEndResult {
  surplus: number
  daysLeft: number
  remainingIncome: number
  unfundedBills: UnfundedBill[]
  unfundedTotal: number
  projection: number
}

// Projected free money at month end: today's surplus, plus an estimate of the income still to come,
// minus what the bills due before month end are missing. Funded bills are already out of the surplus
export function monthEndProjection(input: MonthEndInput): MonthEndResult {
  const { surplus, monthlyIncome, today, bills } = input
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysLeft = daysInMonth - today.getDate()
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

  // Spread the monthly forecast over the days left in the month
  const remainingIncome = monthlyIncome * (daysLeft / daysInMonth)

  const unfundedBills = bills
    .filter(bill => bill.dueDate <= endOfMonth && bill.target - bill.balance > 0)
    .map(bill => ({ name: bill.name, amount: bill.target - bill.balance, dueDate: bill.dueDate }))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

  const unfundedTotal = unfundedBills.reduce((sum, bill) => sum + bill.amount, 0)

  return {
    surplus,
    daysLeft,
    remainingIncome,
    unfundedBills,
    unfundedTotal,
    projection: surplus + remainingIncome - unfundedTotal
  }
}
