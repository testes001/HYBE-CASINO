import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransactionORM, TransactionStatus } from '@/components/data/orm/orm_transaction';
import { adminService } from '@/services/admin.service';
import { toast } from 'sonner';

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: async () => {
      const allTransactions = await TransactionORM.getInstance().getAllTransaction();
      return allTransactions.sort((a, b) => parseInt(b.create_time) - parseInt(a.create_time));
    },
  });

  const approveMutation = useMutation({
    mutationFn: (transactionId: string) => adminService.approveDeposit(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
      toast.success('Deposit approved');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const declineMutation = useMutation({
    mutationFn: (transactionId: string) => adminService.declineDeposit(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
      toast.success('Deposit declined');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getStatusVariant = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING:
        return 'yellow';
      case TransactionStatus.COMPLETED:
        return 'green';
      case TransactionStatus.FAILED:
        return 'red';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Transactions</h2>
        {isLoading ? (
          <p>Loading transactions...</p>
        ) : (
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.user_id}</TableCell>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell>{tx.amount} {tx.currency}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(tx.status)}>
                        {TransactionStatus[tx.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tx.status === TransactionStatus.PENDING && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-500"
                            onClick={() => approveMutation.mutate(tx.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            onClick={() => declineMutation.mutate(tx.id)}
                            disabled={declineMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
