import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { gameService } from '@/services/game.service';
import type { UserModel } from '@/components/data/orm/orm_user';
import type { WalletModel } from '@/components/data/orm/orm_wallet';

/**
 * Custom hook for wallet management
 */
export function useWallet() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserModel | null>(null);
  const queryClient = useQueryClient();

  // Simulate wallet connection (in production, use Web3 library like ethers.js)
  const connectWallet = useCallback(async () => {
    // Generate a demo wallet address
    const demoAddress = `0x${Math.random().toString(16).substring(2, 42)}`;

    try {
      const result = await authService.connectWallet(demoAddress);
      setConnectedAddress(demoAddress);
      setCurrentUser(result.user);

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['wallet'] });

      return result;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, [queryClient]);

  const disconnectWallet = useCallback(async () => {
    await authService.disconnectWallet();
    setConnectedAddress(null);
    setCurrentUser(null);
    queryClient.clear();
  }, [queryClient]);

  return {
    connectedAddress,
    currentUser,
    isConnected: !!connectedAddress,
    connectWallet,
    disconnectWallet,
  };
}

/**
 * Hook to get wallet balances
 */
export function useWalletBalances(userId: string | null, currency: string = 'ETH') {
  return useQuery({
    queryKey: ['wallet', 'balance', userId, currency],
    queryFn: async () => {
      if (!userId) return null;
      return await gameService.getWalletBalance(userId, currency);
    },
    enabled: !!userId,
    refetchInterval: 1000, // Refetch every 1 second for real-time updates
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale for immediate updates
  });
}

/**
 * Hook to get all user wallets
 */
export function useUserWallets(userId: string | null) {
  return useQuery({
    queryKey: ['wallet', 'all', userId],
    queryFn: async () => {
      if (!userId) return [];

      const currencies = ['ETH', 'BTC', 'USDT'];
      const wallets = await Promise.all(
        currencies.map(currency => gameService.getWalletBalance(userId, currency))
      );

      return wallets.filter((w): w is WalletModel => w !== null);
    },
    enabled: !!userId,
  });
}

/**
 * Hook for deposit functionality (simulation)
 */
export function useDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, currency, amount }: { userId: string; currency: string; amount: string }) => {
      // In production, this would integrate with actual blockchain
      // For demo, we'll add to balance directly via wallet update
      const wallet = await gameService.getWalletBalance(userId, currency);

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const currentBalance = parseFloat(wallet.available_balance);
      const depositAmount = parseFloat(amount);
      const newBalance = (currentBalance + depositAmount).toString();

      // Update wallet
      const walletOrm = await import('@/components/data/orm/orm_wallet');
      await walletOrm.WalletORM.getInstance().setWalletByCurrencyUserId(currency, userId, {
        ...wallet,
        available_balance: newBalance,
      });

      // Create deposit transaction
      const transactionOrm = await import('@/components/data/orm/orm_transaction');
      await transactionOrm.TransactionORM.getInstance().insertTransaction([
        {
          user_id: userId,
          type: transactionOrm.TransactionType.DEPOSIT,
          currency,
          amount,
          balance_before: wallet.available_balance,
          balance_after: newBalance,
          status: transactionOrm.TransactionStatus.COMPLETED,
          game_session_id: null,
          metadata: JSON.stringify({ method: 'demo' }),
          completed_at: Math.floor(Date.now() / 1000).toString(),
        } as any,
      ]);

      return { success: true, newBalance };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
