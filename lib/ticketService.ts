export interface TicketActivity {
  id: string
  date: string
  main: number[]
  stars: number[]
  price: number
  txSig: string
}

export interface JackpotInfo {
  pot: {
    created_at: string;
    current_amount: number;
    id: string;
    last_updated: string;
    total_revenue: number;
    total_tickets_sold: number;
  }
}

export class TicketService {
  // Fetch user's tickets from backend API
  static async getUserTickets(authToken: string): Promise<TicketActivity[]> {
    try {
      console.log('Fetching tickets from backend API...')
      
      const response = await fetch('http://localhost:3001/tickets/my', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        console.error('Backend tickets fetch failed:', response.status, response.statusText)
        return []
      }

      const data = await response.json()
      console.log('Fetched tickets from backend:', data)
      
      // Convert backend tickets to activity format
      const activities: TicketActivity[] = data.tickets?.map((ticket: any) => ({
        id: ticket.id,
        date: ticket.created_at,
        main: ticket.numbers,
        stars: [ticket.powerball],
        price: ticket.price || 0.05, // Default to 0.05 SOL if not provided
        txSig: ticket.transaction_hash,
      })) || []

      console.log('Converted to activities:', activities)
      return activities
    } catch (error) {
      console.error('Error fetching tickets from backend:', error)
      return []
    }
  }

  // Fetch jackpot information from backend API
  static async getJackpot(): Promise<JackpotInfo | null> {
    try {
      console.log('Fetching jackpot from backend API...')
      
      const response = await fetch('http://localhost:3001/pot', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error('Backend jackpot fetch failed:', response.status, response.statusText)
        return null
      }

      const data = await response.json()
      console.log('Fetched jackpot from backend:', data)
      
      return data
    } catch (error) {
      console.error('Error fetching jackpot from backend:', error)
      return null
    }
  }
}
