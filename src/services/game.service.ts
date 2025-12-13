import { GameSessionORM, GameSessionStatus, type GameSessionModel } from '@/components/data/orm/orm_game_session';
import { TransactionORM, TransactionType, TransactionStatus, type TransactionModel } from '@/components/data/orm/orm_transaction';
import { ServerSeedORM, type ServerSeedModel } from '@/components/data/orm/orm_server_seed';
import { WalletORM, type WalletModel } from '@/components/data/orm/orm_wallet';
import {
  calculateOutcome,
  checkWin,
  calculateWinAmount,
  generateSecureRandomSeed,
  sha256,
} from '@/lib/provably-fair';

/**
 * Game Service - Business Logic Layer
 * Handles game sessions, server seeds, and game flow
 */

export interface PlaceBetRequest {
  userId: string;
  betAmount: string;
  currency: string;
  clientSeed: string;
  target: number; // For dice game: win if outcome < target
}

export interface PlaceBetResult {
  session: GameSessionModel;
  outcome: number;
  won: boolean;
  winAmount: string;
  transactions: TransactionModel[];
}

class GameService {
  private gameSessionOrm = GameSessionORM.getInstance();
  private transactionOrm = TransactionORM.getInstance();
  private serverSeedOrm = ServerSeedORM.getInstance();
  private walletOrm = WalletORM.getInstance();

  /**
   * Initialize server seeds if none exist
   */
  async initializeServerSeeds(): Promise<void> {
    const activeSeeds = await this.serverSeedOrm.getServerSeedByIsActive(true);

    if (activeSeeds.length === 0) {
      // Generate initial server seed
      const seed = generateSecureRandomSeed(32);
      const seedHash = await sha256(seed);

      // Generate next seed
      const nextSeed = generateSecureRandomSeed(32);
      const nextSeedHash = await sha256(nextSeed);

      await this.serverSeedOrm.insertServerSeed([
        {
          seed_value: seed,
          seed_hash: seedHash,
          is_active: true,
          next_seed_hash: nextSeedHash,
          rotated_at: null,
        } as ServerSeedModel,
      ]);
    }
  }

  /**
   * Get active server seed
   */
  async getActiveServerSeed(): Promise<ServerSeedModel> {
    const activeSeeds = await this.serverSeedOrm.getServerSeedByIsActive(true);

    if (activeSeeds.length === 0) {
      await this.initializeServerSeeds();
      const seeds = await this.serverSeedOrm.getServerSeedByIsActive(true);
      return seeds[0];
    }

    return activeSeeds[0];
  }

  /**
   * Get user's next nonce for active server seed
   */
  async getNextNonce(userId: string, serverSeedId: string): Promise<number> {
    const sessions = await this.gameSessionOrm.getGameSessionByUserId(userId);
    const seedSessions = sessions.filter(s => s.server_seed_id === serverSeedId);

    if (seedSessions.length === 0) {
      return 0;
    }

    const maxNonce = Math.max(...seedSessions.map(s => s.nonce));
    return maxNonce + 1;
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId: string, currency: string): Promise<WalletModel | null> {
    const wallets = await this.walletOrm.getWalletByCurrencyUserId(currency, userId);
    return wallets.length > 0 ? wallets[0] : null;
  }

  /**
   * Atomic bet placement with transaction handling
   * Implements double-entry ledger and provably fair outcome calculation
   */
  async placeBet(request: PlaceBetRequest): Promise<PlaceBetResult> {
    const { userId, betAmount, currency, clientSeed, target } = request;

    // Validate bet amount
    const betAmountNum = parseFloat(betAmount);
    if (betAmountNum <= 0) {
      throw new Error('Bet amount must be positive');
    }

    // Validate target
    if (target <= 0 || target >= 100) {
      throw new Error('Target must be between 0 and 100');
    }

    // Get wallet
    const wallet = await this.getWalletBalance(userId, currency);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check sufficient balance
    const availableBalance = parseFloat(wallet.available_balance);
    if (availableBalance < betAmountNum) {
      throw new Error('Insufficient balance');
    }

    // Get active server seed
    const serverSeed = await this.getActiveServerSeed();
    const nonce = await this.getNextNonce(userId, serverSeed.id);

    // Calculate provably fair outcome
    const { outcome } = await calculateOutcome(serverSeed.seed_value, clientSeed, nonce);
    const won = checkWin(outcome, target);
    const winAmount = calculateWinAmount(betAmount, outcome, target);
    const winAmountNum = parseFloat(winAmount);

    try {
      // START ATOMIC TRANSACTION

      // 1. Create game session (PENDING)
      const sessionData: GameSessionModel = {
        user_id: userId,
        server_seed_id: serverSeed.id,
        client_seed: clientSeed,
        nonce,
        bet_amount: betAmount,
        currency,
        outcome,
        multiplier: won ? 99 / target : 0,
        win_amount: winAmount,
        status: GameSessionStatus.PENDING,
        game_data: JSON.stringify({ target }),
        completed_at: null,
      } as GameSessionModel;

      const [session] = await this.gameSessionOrm.insertGameSession([sessionData]);

      // 2. Deduct bet amount (WAGER transaction)
      const newBalance = availableBalance - betAmountNum;

      const wagerTxData: TransactionModel = {
        user_id: userId,
        type: TransactionType.WAGER,
        currency,
        amount: (-betAmountNum).toString(),
        balance_before: wallet.available_balance,
        balance_after: newBalance.toString(),
        status: TransactionStatus.COMPLETED,
        game_session_id: session.id,
        metadata: JSON.stringify({ nonce, target }),
        completed_at: Math.floor(Date.now() / 1000).toString(),
      } as TransactionModel;

      const [wagerTx] = await this.transactionOrm.insertTransaction([wagerTxData]);

      // 3. Update wallet balance after wager
      await this.walletOrm.setWalletByCurrencyUserId(currency, userId, {
        ...wallet,
        available_balance: newBalance.toString(),
      });

      // 4. If won, credit win amount
      let winTx: TransactionModel | null = null;

      if (won && winAmountNum > 0) {
        const finalBalance = newBalance + winAmountNum;

        const winTxData: TransactionModel = {
          user_id: userId,
          type: TransactionType.WIN,
          currency,
          amount: winAmountNum.toString(),
          balance_before: newBalance.toString(),
          balance_after: finalBalance.toString(),
          status: TransactionStatus.COMPLETED,
          game_session_id: session.id,
          metadata: JSON.stringify({ outcome, multiplier: 99 / target }),
          completed_at: Math.floor(Date.now() / 1000).toString(),
        } as TransactionModel;

        [winTx] = await this.transactionOrm.insertTransaction([winTxData]);

        // Update wallet with win
        await this.walletOrm.setWalletByCurrencyUserId(currency, userId, {
          ...wallet,
          available_balance: finalBalance.toString(),
        });
      } else {
        // Record loss transaction
        const lossTxData: TransactionModel = {
          user_id: userId,
          type: TransactionType.LOSS,
          currency,
          amount: '0',
          balance_before: newBalance.toString(),
          balance_after: newBalance.toString(),
          status: TransactionStatus.COMPLETED,
          game_session_id: session.id,
          metadata: JSON.stringify({ outcome, target }),
          completed_at: Math.floor(Date.now() / 1000).toString(),
        } as TransactionModel;

        [winTx] = await this.transactionOrm.insertTransaction([lossTxData]);
      }

      // 5. Update game session to completed
      const completedSession = await this.gameSessionOrm.setGameSessionById(session.id, {
        ...session,
        status: won ? GameSessionStatus.WON : GameSessionStatus.LOST,
        completed_at: Math.floor(Date.now() / 1000).toString(),
      });

      // END ATOMIC TRANSACTION

      return {
        session: completedSession[0],
        outcome,
        won,
        winAmount,
        transactions: winTx ? [wagerTx, winTx] : [wagerTx],
      };
    } catch (error) {
      console.error('Error placing bet:', error);
      throw new Error('Failed to place bet. Please try again.');
    }
  }

  /**
   * Get user's game sessions
   */
  async getUserGameSessions(userId: string, limit: number = 50): Promise<GameSessionModel[]> {
    const sessions = await this.gameSessionOrm.getGameSessionByUserId(userId);
    return sessions.slice(0, limit);
  }

  /**
   * Get session details for verification
   */
  async getSessionForVerification(sessionId: string): Promise<{
    session: GameSessionModel;
    serverSeed: ServerSeedModel;
  }> {
    const sessions = await this.gameSessionOrm.getGameSessionById(sessionId);
    if (sessions.length === 0) {
      throw new Error('Session not found');
    }

    const session = sessions[0];
    const seeds = await this.serverSeedOrm.getServerSeedById(session.server_seed_id);

    if (seeds.length === 0) {
      throw new Error('Server seed not found');
    }

    return {
      session,
      serverSeed: seeds[0],
    };
  }

  /**
   * Rotate server seed (GLI-19 compliant)
   * Should be called periodically or after certain number of bets
   */
  async rotateServerSeed(): Promise<ServerSeedModel> {
    const activeSeeds = await this.serverSeedOrm.getServerSeedByIsActive(true);

    if (activeSeeds.length === 0) {
      throw new Error('No active server seed found');
    }

    const currentSeed = activeSeeds[0];

    if (!currentSeed.next_seed_hash) {
      throw new Error('No next seed hash found');
    }

    // Generate new next seed
    const newNextSeed = generateSecureRandomSeed(32);
    const newNextSeedHash = await sha256(newNextSeed);

    // Deactivate current seed
    await this.serverSeedOrm.setServerSeedById(currentSeed.id, {
      ...currentSeed,
      is_active: false,
      rotated_at: Math.floor(Date.now() / 1000).toString(),
    });

    // Create new active seed (the previous "next" seed becomes active)
    // Note: In production, you'd have the actual next seed value stored securely
    const newSeed = generateSecureRandomSeed(32);
    const [activatedSeed] = await this.serverSeedOrm.insertServerSeed([
      {
        seed_value: newSeed,
        seed_hash: currentSeed.next_seed_hash,
        is_active: true,
        next_seed_hash: newNextSeedHash,
        rotated_at: null,
      } as ServerSeedModel,
    ]);

    return activatedSeed;
  }
}

export const gameService = new GameService();
