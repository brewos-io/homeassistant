import { QRCodeSVG } from 'qrcode.react';
import { Card, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QRCodeDisplayProps {
  url: string;
  deviceId: string;
  expiresIn: number;
  onRefresh: () => void;
  loading?: boolean;
}

export function QRCodeDisplay({ url, deviceId, expiresIn, onRefresh, loading }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(expiresIn);

  useEffect(() => {
    setTimeLeft(expiresIn);
    
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresIn]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft <= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pair Device</CardTitle>
      </CardHeader>

      <div className="text-center">
        <p className="text-sm text-coffee-500 mb-4">
          Scan this QR code with your phone to add this device to your account.
        </p>

        <div className={`inline-block p-4 bg-white rounded-xl ${isExpired ? 'opacity-50' : ''}`}>
          <QRCodeSVG
            value={url}
            size={200}
            level="M"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#1a1a1a"
          />
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm font-mono text-coffee-600">{deviceId}</p>
          
          {isExpired ? (
            <p className="text-sm text-red-600">Code expired</p>
          ) : (
            <p className="text-sm text-coffee-400">
              Expires in {formatTime(timeLeft)}
            </p>
          )}
        </div>

        <div className="flex gap-2 justify-center mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            disabled={isExpired}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            loading={loading}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>
    </Card>
  );
}

