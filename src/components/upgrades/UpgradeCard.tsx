import { useTeam } from "@/context/TeamContext";
import { Upgrade } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap } from "lucide-react";
import { toast } from "sonner";

interface UpgradeCardProps {
  upgrade: Upgrade;
}

const UpgradeCard = ({ upgrade }: UpgradeCardProps) => {
  const { userTeam, purchaseUpgrade } = useTeam();

  if (!userTeam) return null;

  const isPurchased = userTeam.upgrades.includes(upgrade.id);
  const canAfford = userTeam.financials.budgetAllocations.Facilities >= upgrade.cost;

  const handlePurchase = () => {
    if (isPurchased) {
        toast.info("You have already purchased this upgrade.");
        return;
    }
    purchaseUpgrade(upgrade.id);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          {upgrade.name}
        </CardTitle>
        <CardDescription>{upgrade.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="bg-secondary p-3 rounded-md">
            <p className="font-semibold text-primary">{upgrade.benefitDescription}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <p className="text-lg font-bold">£{upgrade.cost.toLocaleString()}</p>
        {isPurchased ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>Purchased</span>
          </div>
        ) : (
          <Button onClick={handlePurchase} disabled={!canAfford}>
            Purchase
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default UpgradeCard;