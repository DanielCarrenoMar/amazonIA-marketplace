export interface ProductMetricsDto {
  totalSales: number;
  totalRevenue: number;
  pendingOrders: number;
  totalViews: number;       // We can mock this or keep it 0 if not tracked
  averageRating: number;
  totalReviews: number;
  salesByDate: { date: string; sales: number }[]; // For charts
}
