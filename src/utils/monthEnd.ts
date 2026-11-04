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
  // Paychecks still to come before month end (tomorrow to the last day), each at its amount
  incomeToCome: number
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

// Projected free money at month end: today's surplus, plus the paychecks still to come before month end,
// minus what the bills due before month end are missing. Funded bills are already out of the surplus
export function monthEndProjection(input: MonthEndInput): MonthEndResult {
  const { surplus, incomeToCome, today, bills } = input
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysLeft = daysInMonth - today.getDate()
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

  const remainingIncome = incomeToCome

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
