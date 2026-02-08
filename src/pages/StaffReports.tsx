import { useState, useEffect } from 'react';
import { Users, CreditCard, Banknote, Globe, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { reservations, getRevenueByMethod, payments } from '@/data/mockData';
import { rawQuery } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Staff } from '@/types/hotel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function StaffReports() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const revenueByMethod = getRevenueByMethod();

  // Fetch staff from database
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoading(true);
        // Staff table has RLS - need authenticated token
        const { data, error } = await rawQuery('staff', { order: 'first_name.asc' });
        if (error) {
          console.error('Error fetching staff:', error);
          return;
        }
        console.log('Raw staff data:', data);
        const mappedStaff = (data || []).map((s: any) => ({
          Staff_ID: s.staff_id || s.Staff_ID,
          First_Name: s.first_name || s.First_Name,
          Last_Name: s.last_name || s.Last_Name,
          Email: s.email || s.Email,
          Role: s.role || s.Role,
          Shift: s.shift || s.Shift,
          Hire_Date: s.hire_date || s.Hire_Date,
          Status: s.status || s.Status,
        }));
        console.log('Mapped staff:', mappedStaff);
        setStaff(mappedStaff);
      } catch (err) {
        console.error('Failed to fetch staff:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if user is authenticated
    if (user) {
      fetchStaff();
    } else {
      setIsLoading(false);
    }
  }, [user]);
  
  // Calculate reservations handled by each staff (exclude Manager)
  const staffReservations = staff
    .filter(s => s.Role !== 'Manager')
    .map(s => {
      const handled = reservations.filter(r => r.Staff_ID === s.Staff_ID).length;
      return { ...s, reservationsHandled: handled };
    })
    .sort((a, b) => b.reservationsHandled - a.reservationsHandled);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

  const roleColors: Record<string, string> = {
    Manager: 'bg-purple-100 text-purple-800',
    FrontDesk: 'bg-blue-100 text-blue-800',
    Housekeeping: 'bg-green-100 text-green-800',
    Concierge: 'bg-amber-100 text-amber-800',
    Accountant: 'bg-rose-100 text-rose-800',
  };

  const chartColors = ['#1e3a5f', '#d97706', '#059669'];

  const methodIcons: Record<string, typeof CreditCard> = {
    Card: CreditCard,
    Cash: Banknote,
    Online: Globe,
  };

  // Calculate total paid and pending
  const totalPaid = payments.filter(p => p.Status === 'Paid').reduce((sum, p) => sum + p.Amount, 0);
  const totalPending = payments.filter(p => p.Status === 'Pending').reduce((sum, p) => sum + p.Amount, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Staff & Reports" 
        description="Staff directory and financial reports"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Staff Directory */}
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground">
                Staff Directory
              </h2>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold text-right">Reservations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Loading staff...
                  </TableCell>
                </TableRow>
              ) : staffReservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No staff members found. Please add staff to the database.
                  </TableCell>
                </TableRow>
              ) : (
                staffReservations.map((member, index) => (
                  <TableRow 
                    key={member.Staff_ID}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                          {member.First_Name[0]}{member.Last_Name[0]}
                        </div>
                        <span className="font-medium">
                          {member.First_Name} {member.Last_Name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[member.Role] || 'bg-gray-100 text-gray-800'}`}>
                        {member.Role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {member.reservationsHandled}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Revenue by Payment Method */}
        <div className="bg-card rounded-xl shadow-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-display font-semibold text-foreground">
              Revenue by Payment Method
            </h2>
          </div>
          
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMethod}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="method" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₱${v/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {revenueByMethod.map((item, index) => {
              const Icon = methodIcons[item.method] || CreditCard;
              const total = revenueByMethod.reduce((sum, i) => sum + i.amount, 0);
              const percentage = Math.round((item.amount / total) * 100);
              
              return (
                <div 
                  key={item.method}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: chartColors[index] + '20', color: chartColors[index] }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{item.method}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-muted-foreground">{percentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="lg:col-span-2 bg-card rounded-xl shadow-card p-6">
          <h2 className="text-lg font-display font-semibold text-foreground mb-6">
            Payment Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl gradient-primary text-primary-foreground p-6">
              <p className="text-sm opacity-80">Total Collected</p>
              <p className="text-3xl font-bold font-display mt-2">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="rounded-xl gradient-accent text-accent-foreground p-6">
              <p className="text-sm opacity-80">Pending Payments</p>
              <p className="text-3xl font-bold font-display mt-2">{formatCurrency(totalPending)}</p>
            </div>
            <div className="rounded-xl bg-muted p-6">
              <p className="text-sm text-muted-foreground">Grand Total</p>
              <p className="text-3xl font-bold font-display mt-2 text-foreground">
                {formatCurrency(totalPaid + totalPending)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
