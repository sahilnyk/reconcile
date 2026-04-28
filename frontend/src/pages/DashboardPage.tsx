import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, Search, TrendingDown, TrendingUp, DollarSign, FileText, Users, Receipt } from "lucide-react";
import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Dummy data for layout preview - Indian context
const dummyInvoices = [
  { id: "1", invoice_number: "INV-2024-001", vendor: "Tata Consultancy Services", invoice_date: "2024-01-15", total: 1250000, status: "Paid" },
  { id: "2", invoice_number: "INV-2024-002", vendor: "Infosys Ltd", invoice_date: "2024-01-18", total: 875000, status: "Pending" },
  { id: "3", invoice_number: "INV-2024-003", vendor: "Wipro Technologies", invoice_date: "2024-01-20", total: 1520000, status: "Paid" },
  { id: "4", invoice_number: "INV-2024-004", vendor: "HCL Technologies", invoice_date: "2024-01-22", total: 560000, status: "Overdue" },
  { id: "5", invoice_number: "INV-2024-005", vendor: "Tech Mahindra", invoice_date: "2024-01-25", total: 320000, status: "Paid" },
  { id: "6", invoice_number: "INV-2024-006", vendor: "Cognizant India", invoice_date: "2024-01-28", total: 980000, status: "Pending" },
  { id: "7", invoice_number: "INV-2024-007", vendor: "Deloitte India", invoice_date: "2024-02-01", total: 2200000, status: "Paid" },
  { id: "8", invoice_number: "INV-2024-008", vendor: "KPMG India", invoice_date: "2024-02-05", total: 450000, status: "Paid" },
];

const dummyVendors = [
  { name: "Tata Consultancy Services", total: 1250000, count: 3 },
  { name: "Deloitte India", total: 2200000, count: 1 },
  { name: "Wipro Technologies", total: 1520000, count: 2 },
  { name: "Cognizant India", total: 980000, count: 2 },
  { name: "Infosys Ltd", total: 875000, count: 3 },
];

const dummyExpenses = [
  { category: "Software Licenses", amount: 450000, date: "2024-01" },
  { category: "IT Services", amount: 1200000, date: "2024-01" },
  { category: "Consulting", amount: 2200000, date: "2024-01" },
  { category: "Marketing", amount: 980000, date: "2024-01" },
  { category: "Infrastructure", amount: 1520000, date: "2024-01" },
];

const monthlyData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Revenue',
      data: [8500000, 9200000, 8800000, 12500000, 11200000, 13500000],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      tension: 0.3,
      fill: true,
      pointRadius: 0,
      pointHitRadius: 20,
      borderWidth: 2,
    },
    {
      label: 'Expenses',
      data: [6200000, 5800000, 7100000, 8245000, 7800000, 9200000],
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      tension: 0.3,
      fill: true,
      pointRadius: 0,
      pointHitRadius: 20,
      borderWidth: 2,
    },
  ],
};

const expenseCategoryData = {
  labels: ['Software', 'IT Services', 'Consulting', 'Marketing', 'Infrastructure'],
  datasets: [
    {
      data: [450000, 1200000, 2200000, 980000, 1520000],
      backgroundColor: [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6',
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 4,
    },
  ],
};

const vendorData = {
  labels: dummyVendors.map(v => v.name.split(' ')[0]),
  datasets: [
    {
      label: 'Total Spent',
      data: dummyVendors.map(v => v.total),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderRadius: 6,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        usePointStyle: false,
        boxWidth: 12,
        boxHeight: 2,
        font: { size: 11, weight: '500' },
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 10,
      cornerRadius: 6,
      titleFont: { size: 12 },
      bodyFont: { size: 11 },
      callbacks: {
        label: (context: any) => {
          return `₹${(context.raw / 100000).toFixed(2)}L`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0, 0, 0, 0.04)', drawBorder: false },
      ticks: {
        font: { size: 10 },
        callback: (value: number) => `₹${(value / 1000000).toFixed(0)}M`,
        padding: 8,
      },
      border: { display: false },
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 } },
      border: { display: false },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      align: 'center' as const,
      labels: {
        usePointStyle: false,
        boxWidth: 10,
        boxHeight: 10,
        font: { size: 10, weight: '500' },
        padding: 12,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 10,
      cornerRadius: 6,
      callbacks: {
        label: (context: any) => {
          const val = context.raw as number;
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const pct = ((val / total) * 100).toFixed(1);
          return ` ₹${(val / 100000).toFixed(1)}L (${pct}%)`;
        },
      },
    },
  },
  cutout: '60%',
};

export function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Paid: "bg-emerald-100 text-emerald-700",
      Pending: "bg-amber-100 text-amber-700",
      Overdue: "bg-rose-100 text-rose-700",
    };
    return (
      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  const filteredInvoices = dummyInvoices.filter(inv => {
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    const matchesSearch = inv.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Track your business performance and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Last 30 days</span>
          <button className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 border rounded-none">
        <div className="p-4 border-r border-b">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total Expenses</p>
          <p className="text-lg font-bold mt-1 font-mono">{formatCurrency(8245000)}</p>
          <p className="text-[10px] text-rose-600 mt-0.5 font-medium">+12% from last month</p>
        </div>
        <div className="p-4 border-r border-b">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Revenue</p>
          <p className="text-lg font-bold text-emerald-600 mt-1 font-mono">{formatCurrency(12500000)}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">+8% from last month</p>
        </div>
        <div className="p-4 border-r border-b">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Net Profit</p>
          <p className="text-lg font-bold text-emerald-600 mt-1 font-mono">{formatCurrency(4255000)}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">+15% from last month</p>
        </div>
        <div className="p-4 border-r border-b">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total Invoices</p>
          <p className="text-lg font-bold mt-1 font-mono">24</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">8 pending approval</p>
        </div>
        <div className="p-4 border-r border-b">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Vendors</p>
          <p className="text-lg font-bold mt-1 font-mono">12</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">+2 new this month</p>
        </div>
        <div className="p-4 border-r border-b">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Pending</p>
          <p className="text-lg font-bold mt-1 font-mono">{formatCurrency(1835000)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Due within 7 days</p>
        </div>
        <div className="p-4 border-b lg:border-r-0 col-span-2 md:col-span-4 lg:col-span-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Avg Invoice</p>
          <p className="text-lg font-bold mt-1 font-mono">{formatCurrency(1035625)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Per transaction</p>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-3 border rounded-none">
        <div className="lg:col-span-2 border-r">
          <div className="p-4 border-b">
            <p className="text-sm font-medium">Revenue vs Expenses</p>
          </div>
          <div className="p-4">
            <div className="h-56">
              <Line data={monthlyData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div>
          <div className="p-4 border-b">
            <p className="text-sm font-medium">Expenses by Category</p>
          </div>
          <div className="p-4">
            <div className="h-56">
              <Doughnut data={expenseCategoryData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-2 border rounded-none">
        <div className="border-r">
          <div className="p-4 border-b flex items-center justify-between">
            <p className="text-sm font-medium">Recent Invoices</p>
            <span className="text-xs text-muted-foreground">{filteredInvoices.length} results</span>
          </div>
          <div className="p-4">
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-none bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 text-xs border rounded-none bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="All">All</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div className="border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="text-[10px] uppercase font-semibold py-2 px-3 text-muted-foreground">Invoice</TableHead>
                    <TableHead className="text-[10px] uppercase font-semibold py-2 px-3 text-muted-foreground">Vendor</TableHead>
                    <TableHead className="text-[10px] uppercase font-semibold py-2 px-3 text-muted-foreground text-right">Amount</TableHead>
                    <TableHead className="text-[10px] uppercase font-semibold py-2 px-3 text-muted-foreground text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice, index) => (
                    <TableRow
                      key={invoice.id}
                      className={index % 2 === 0 ? "bg-white hover:bg-muted/50" : "bg-muted/30 hover:bg-muted/50"}
                    >
                      <TableCell className="text-[11px] py-2 px-3 font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell className="text-[11px] py-2 px-3 text-muted-foreground truncate max-w-[120px]">{invoice.vendor}</TableCell>
                      <TableCell className="text-[11px] py-2 px-3 text-right font-medium">{formatCurrency(invoice.total)}</TableCell>
                      <TableCell className="py-2 px-3 text-center">{getStatusBadge(invoice.status)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div>
          <div className="p-4 border-b">
            <p className="text-sm font-medium">Top Vendors</p>
          </div>
          <div className="p-4">
            <div className="h-56">
              <Bar
                data={{
                  labels: dummyVendors.map(v => v.name.split(' ')[0]),
                  datasets: [{
                    label: 'Total Spent',
                    data: dummyVendors.map(v => v.total),
                    backgroundColor: '#64748b',
                    hoverBackgroundColor: '#475569',
                    borderRadius: 0,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx: any) => `₹${(ctx.raw / 100000).toFixed(1)}L`,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(0, 0, 0, 0.04)', drawBorder: false },
                      ticks: {
                        font: { size: 10 },
                        callback: (value: number) => `₹${(value / 1000000).toFixed(0)}M`,
                      },
                      border: { display: false },
                    },
                    x: {
                      grid: { display: false },
                      ticks: { font: { size: 10 } },
                      border: { display: false },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
