
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Zap, Mic, FileText, CheckCircle, Loader2 } from "lucide-react";

interface PremiumUpgradeProps {
  onUpgrade: () => Promise<any>;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PremiumUpgrade = ({ onUpgrade }: PremiumUpgradeProps) => {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Initialize payment
      const paymentData = await onUpgrade();
      if (!paymentData) {
        throw new Error('Failed to initialize payment');
      }

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'AI Interviewer',
        description: 'Premium Upgrade - Unlock Voice Interviews',
        order_id: paymentData.orderId,
        theme: {
          color: '#2563eb'
        },
        handler: function (response: any) {
          console.log('Payment successful:', response);
          // Payment success is handled by webhook
          setLoading(false);
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Star className="w-6 h-6 text-blue-600" />
          <span>Upgrade to Premium</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full mb-4">
            <Zap className="w-4 h-4" />
            <span className="font-semibold">Limited Time Offer</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">₹1</div>
          <p className="text-gray-600">One-time payment for complete interview experience</p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Premium Features:</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">All Free features included</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Voice-based interview simulation</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Real-time speech recognition</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Detailed AI feedback on all answers</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Downloadable PDF report</span>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Star className="w-5 h-5 mr-2" />
                Upgrade Now - ₹1
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Secure payment powered by Razorpay
          </p>
        </div>

        <div className="bg-white/60 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="secondary" className="text-xs">₹1 Test Payment</Badge>
          </div>
          <p className="text-sm text-gray-600">
            Integrated with Razorpay for secure payments. Test with ₹1 payment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumUpgrade;
