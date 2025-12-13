import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle2, XCircle, Copy } from 'lucide-react';
import { useVerifyGame } from '@/hooks/useGame';

interface FairnessVerificationProps {
  sessionId?: string;
  serverSeed?: string;
  clientSeed?: string;
  nonce?: number;
  expectedOutcome?: number;
}

export function FairnessVerification({
  sessionId,
  serverSeed: initialServerSeed,
  clientSeed: initialClientSeed,
  nonce: initialNonce,
  expectedOutcome: initialOutcome,
}: FairnessVerificationProps) {
  const [serverSeed, setServerSeed] = useState(initialServerSeed || '');
  const [clientSeed, setClientSeed] = useState(initialClientSeed || '');
  const [nonce, setNonce] = useState(initialNonce?.toString() || '0');
  const [expectedOutcome, setExpectedOutcome] = useState(
    initialOutcome?.toString() || ''
  );

  const verifyMutation = useVerifyGame();

  const handleVerify = () => {
    if (!serverSeed || !clientSeed || !expectedOutcome) {
      alert('Please fill in all fields');
      return;
    }

    verifyMutation.mutate({
      serverSeed,
      clientSeed,
      nonce: parseInt(nonce),
      expectedOutcome: parseFloat(expectedOutcome),
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Provably Fair Verification</h3>
          <p className="text-sm text-muted-foreground">
            Verify game outcomes using cryptographic proof
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="serverSeed">Server Seed</Label>
          <div className="flex gap-2">
            <Input
              id="serverSeed"
              value={serverSeed}
              onChange={e => setServerSeed(e.target.value)}
              placeholder="Enter server seed (revealed after rotation)"
            />
            {serverSeed && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(serverSeed)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="clientSeed">Client Seed</Label>
          <div className="flex gap-2">
            <Input
              id="clientSeed"
              value={clientSeed}
              onChange={e => setClientSeed(e.target.value)}
              placeholder="Enter client seed"
            />
            {clientSeed && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(clientSeed)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="nonce">Nonce</Label>
          <Input
            id="nonce"
            type="number"
            value={nonce}
            onChange={e => setNonce(e.target.value)}
            placeholder="Enter nonce"
          />
        </div>

        <div>
          <Label htmlFor="expectedOutcome">Expected Outcome</Label>
          <Input
            id="expectedOutcome"
            type="number"
            step="0.01"
            value={expectedOutcome}
            onChange={e => setExpectedOutcome(e.target.value)}
            placeholder="Enter expected outcome (0-99.99)"
          />
        </div>

        <Button
          className="w-full"
          onClick={handleVerify}
          disabled={verifyMutation.isPending}
        >
          <Shield className="w-4 h-4 mr-2" />
          Verify Outcome
        </Button>

        {verifyMutation.isSuccess && verifyMutation.data && (
          <Alert
            variant={verifyMutation.data.isValid ? 'default' : 'destructive'}
          >
            <div className="flex items-start gap-3">
              {verifyMutation.data.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  <p className="font-semibold mb-2">
                    {verifyMutation.data.isValid
                      ? 'Verification Successful ✓'
                      : 'Verification Failed ✗'}
                  </p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Calculated Outcome:</span>{' '}
                      {verifyMutation.data.calculatedOutcome.toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium">Expected Outcome:</span>{' '}
                      {verifyMutation.data.expectedOutcome.toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium">HMAC (first 8 chars):</span>{' '}
                      {verifyMutation.data.hex}
                    </p>
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">
                        Full HMAC-SHA256
                      </summary>
                      <p className="mt-1 break-all font-mono text-xs">
                        {verifyMutation.data.hmac}
                      </p>
                    </details>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg text-sm space-y-2">
        <p className="font-semibold">How it works:</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>
            Server generates a secret seed and displays its hash before the game
          </li>
          <li>Player provides their own client seed</li>
          <li>
            Outcome is calculated using HMAC-SHA256(serverSeed, clientSeed:nonce)
          </li>
          <li>
            First 8 hex characters are converted to decimal, then modulo 10000
          </li>
          <li>After seed rotation, server seed is revealed for verification</li>
        </ol>
      </div>
    </Card>
  );
}
