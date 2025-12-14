import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

interface WalletConnectProps {
  isConnected: boolean;
  connectedAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnect({
  isConnected,
  connectedAddress,
  onConnect,
  onDisconnect,
}: WalletConnectProps) {
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (isConnected && connectedAddress) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card variant="glass-glow" className="p-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <motion.div
              className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
              animate={{ boxShadow: ["0 0 10px rgba(59, 130, 246, 0.5)", "0 0 20px rgba(59, 130, 246, 0.8)", "0 0 10px rgba(59, 130, 246, 0.5)"] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <Wallet className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <p className="text-sm font-medium">Connected Wallet</p>
              <motion.p
                className="text-xs text-muted-foreground font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {formatAddress(connectedAddress)}
              </motion.p>
            </div>
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Button variant="outline" size="sm" onClick={onDisconnect}>
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="glass-glow" className="p-6 text-center">
        <motion.div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mx-auto mb-4"
          animate={{
            boxShadow: [
              "0 0 20px rgba(59, 130, 246, 0.3)",
              "0 0 40px rgba(59, 130, 246, 0.6)",
              "0 0 20px rgba(59, 130, 246, 0.3)",
            ],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          >
            <Wallet className="w-8 h-8 text-primary" />
          </motion.div>
        </motion.div>
        <motion.h3
          className="text-lg font-semibold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Connect Your Wallet
        </motion.h3>
        <motion.p
          className="text-sm text-muted-foreground mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Connect your crypto wallet to start playing
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button onClick={onConnect} size="lg">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </motion.div>
      </Card>
    </motion.div>
  );
}
