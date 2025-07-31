// Helper function to handle errors
const handleError = (error, defaultData = null) => {
  console.error('Profit margin details error:', error);
  return { data: defaultData, error: error.message };
};

export const profitMarginDetailsService = {
  async getProfitMarginDetails() {
    try {
      // Generate profit margin data for the last 12 months
      const months = [];
      const grossMargin = [];
      const netMargin = [];
      const operatingMargin = [];
      
      const currentDate = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        
        // Generate realistic profit margin data
        const baseGross = 45 + Math.random() * 10;
        const baseOperating = 25 + Math.random() * 8;
        const baseNet = 15 + Math.random() * 6;
        
        grossMargin.push(parseFloat(baseGross.toFixed(1)));
        operatingMargin.push(parseFloat(baseOperating.toFixed(1)));
        netMargin.push(parseFloat(baseNet.toFixed(1)));
      }

      // Calculate summary statistics
      const avgGross = grossMargin.reduce((a, b) => a + b, 0) / grossMargin.length;
      const avgOperating = operatingMargin.reduce((a, b) => a + b, 0) / operatingMargin.length;
      const avgNet = netMargin.reduce((a, b) => a + b, 0) / netMargin.length;

      return {
        data: {
          chartType: 'line',
          labels: months,
          datasets: [
            {
              label: 'Gross Profit Margin',
              data: grossMargin,
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4
            },
            {
              label: 'Operating Margin',
              data: operatingMargin,
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4
            },
            {
              label: 'Net Profit Margin',
              data: netMargin,
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              tension: 0.4
            }
          ],
          summary: {
            currentGross: grossMargin[grossMargin.length - 1],
            currentOperating: operatingMargin[operatingMargin.length - 1],
            currentNet: netMargin[netMargin.length - 1],
            avgGross: parseFloat(avgGross.toFixed(1)),
            avgOperating: parseFloat(avgOperating.toFixed(1)),
            avgNet: parseFloat(avgNet.toFixed(1)),
            trend: netMargin[netMargin.length - 1] > netMargin[netMargin.length - 2] ? 'up' : 'down'
          }
        },
        error: null
      };
    } catch (error) {
      return handleError(error, {});
    }
  }
};