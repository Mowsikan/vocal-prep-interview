
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Zap, Mic, FileText, CheckCircle } from "lucide-react";

interface PremiumUpgradeProps {
  onUpgrade: () => void;
}

const PremiumUpgrade = ({ onUpgrade }: PremiumUpgradeProps) => {
  const handleUpgrade = () => {
    // Call the parent's upgrade function which now handles database updates
    onUpgrade();
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
          <div className="text-3xl font-bold text-gray-900 mb-2">₹199</div>
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
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
          >
            <Star className="w-5 h-5 mr-2" />
            Upgrade Now - ₹199
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Secure payment powered by Razorpay
          </p>
        </div>

        <div className="bg-white/60 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="secondary" className="text-xs">Demo Mode</Badge>
          </div>
          <p className="text-sm text-gray-600">
            This is a demonstration. In production, this would integrate with Razorpay for secure payments.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumUpgrade;
