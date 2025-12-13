import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameService, type PlaceBetRequest } from '@/services/game.service';
import { calculateOutcome, verifyOutcome } from '@/lib/provably-fair';

/**
 * Hook to place a bet
 */
export function usePlaceBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: PlaceBetRequest) => {
      return await gameService.placeBet(request);
    },
    onMutate: async (request: PlaceBetRequest) => {
      // Cancel any outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ['wallet'] });
      await queryClient.cancelQueries({ queryKey: ['gameSessions'] });

      // Snapshot the previous value for rollback on error
      const previousWallet = queryClient.getQueryData(['wallet', 'balance', request.userId, request.currency]);
      const previousSessions = queryClient.getQueryData(['gameSessions', request.userId, 50]);

      return { previousWallet, previousSessions };
    },
    onSuccess: (data, variables) => {
      // Update wallet balance immediately with the result
      queryClient.setQueryData(['wallet', 'balance', variables.userId, variables.currency], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          available_balance: data.won
            ? (parseFloat(old.available_balance) - parseFloat(variables.betAmount) + parseFloat(data.winAmount)).toString()
            : (parseFloat(old.available_balance) - parseFloat(variables.betAmount)).toString(),
        };
      });

      // Add the new session to the sessions list immediately
      queryClient.setQueryData(['gameSessions', variables.userId, 50], (old: any[]) => {
        if (!old) return [data.session];
        return [data.session, ...old];
      });

      // Invalidate and refetch relevant queries for consistency
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['gameSessions'] });

      // Force immediate refetch to ensure server state is synced
      queryClient.refetchQueries({ queryKey: ['wallet'], type: 'active' });
      queryClient.refetchQueries({ queryKey: ['gameSessions'], type: 'active' });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousWallet) {
        queryClient.setQueryData(['wallet', 'balance', variables.userId, variables.currency], context.previousWallet);
      }
      if (context?.previousSessions) {
        queryClient.setQueryData(['gameSessions', variables.userId, 50], context.previousSessions);
      }
      console.error('Bet placement error:', error);
    },
  });
}

/**
 * Hook to get active server seed
 */
export function useActiveServerSeed() {
  return useQuery({
    queryKey: ['serverSeed', 'active'],
    queryFn: async () => {
      return await gameService.getActiveServerSeed();
    },
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Hook to get user's game sessions
 */
export function useGameSessions(userId: string | null, limit: number = 50) {
  return useQuery({
    queryKey: ['gameSessions', userId, limit],
    queryFn: async () => {
      if (!userId) return [];
      const sessions = await gameService.getUserGameSessions(userId, limit);
      // Sort by create_time descending (most recent first)
      return sessions.sort((a, b) => parseInt(b.create_time) - parseInt(a.create_time));
    },
    enabled: !!userId,
    refetchInterval: 500, // Refetch every 500ms for real-time updates
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale for immediate updates
  });
}

/**
 * Hook to get next nonce
 */
export function useNextNonce(userId: string | null, serverSeedId: string | null) {
  return useQuery({
    queryKey: ['nonce', userId, serverSeedId],
    queryFn: async () => {
      if (!userId || !serverSeedId) return 0;
      return await gameService.getNextNonce(userId, serverSeedId);
    },
    enabled: !!userId && !!serverSeedId,
  });
}

/**
 * Hook to verify game fairness
 */
export function useVerifyGame() {
  return useMutation({
    mutationFn: async ({
      serverSeed,
      clientSeed,
      nonce,
      expectedOutcome,
    }: {
      serverSeed: string;
      clientSeed: string;
      nonce: number;
      expectedOutcome: number;
    }) => {
      const result = await calculateOutcome(serverSeed, clientSeed, nonce);
      const isValid = await verifyOutcome(serverSeed, clientSeed, nonce, expectedOutcome);

      return {
        isValid,
        calculatedOutcome: result.outcome,
        expectedOutcome,
        hex: result.hex,
        hmac: result.hmac,
      };
    },
  });
}

/**
 * Hook to get session for verification
 */
export function useSessionForVerification(sessionId: string | null) {
  return useQuery({
    queryKey: ['sessionVerification', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      return await gameService.getSessionForVerification(sessionId);
    },
    enabled: !!sessionId,
  });
}

/**
 * Hook to initialize server seeds
 */
export function useInitializeSeeds() {
  return useMutation({
    mutationFn: async () => {
      return await gameService.initializeServerSeeds();
    },
  });
}
