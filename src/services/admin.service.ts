import { TransactionORM, TransactionStatus } from '@/components/data/orm/orm_transaction';
import { WalletORM } from '@/components/data/orm/orm_wallet';

class AdminService {
  private transactionOrm = TransactionORM.getInstance();
  private walletOrm = WalletORM.getInstance();

  async approveDeposit(transactionId: string): Promise<void> {
    const transactions = await this.transactionOrm.getTransactionById(transactionId);
    if (transactions.length === 0) {
      throw new Error('Transaction not found');
    }
    const transaction = transactions[0];

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new Error('Transaction is not pending');
    }

    const wallets = await this.walletOrm.getWalletByCurrencyUserId(transaction.currency, transaction.user_id);
    if (wallets.length === 0) {
      throw new Error('Wallet not found');
    }
    const wallet = wallets[0];

    const newBalance = (parseFloat(wallet.available_balance) + parseFloat(transaction.amount)).toString();

    await this.walletOrm.setWalletByCurrencyUserId(transaction.currency, transaction.user_id, {
      ...wallet,
      available_balance: newBalance,
    });

    await this.transactionOrm.setTransactionById(transactionId, {
      ...transaction,
      status: TransactionStatus.COMPLETED,
      balance_after: newBalance,
      completed_at: Math.floor(Date.now() / 1000).toString(),
    });
  }

  async declineDeposit(transactionId: string): Promise<void> {
    const transactions = await this.transactionOrm.getTransactionById(transactionId);
    if (transactions.length === 0) {
      throw new Error('Transaction not found');
    }
    const transaction = transactions[0];

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new Error('Transaction is not pending');
    }

    await this.transactionOrm.setTransactionById(transactionId, {
      ...transaction,
      status: TransactionStatus.FAILED,
      completed_at: Math.floor(Date.now() / 1000).toString(),
    });
  }
}

export const adminService = new AdminService();
