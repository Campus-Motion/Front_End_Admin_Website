import { useEffect, useState } from 'react'
import { availableMonths, calculateTotals, monthLabel } from '../domain/points'
import { TicketWheel } from './TicketWheel'

export function usePointsMonths() {
  const [months, setMonths] = useState(availableMonths)
  useEffect(() => {
    function refresh() {
      const updated = availableMonths()
      setMonths(current => current[0] === updated[0] ? current : updated)
    }
    const timer = setInterval(refresh, 1000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  return months
}

export function MonthlyPoints({ users, events, points, adjustments, months }) {
  return (
    <>
      {months.map((key, index) => (
        <TicketWheel key={key} month={key} users={users} totals={calculateTotals(events, points, adjustments, key)} title={(index ? 'Mois précédent · ' : 'Mois actuel · ') + monthLabel(key)} />
      ))}
    </>
  )
}
