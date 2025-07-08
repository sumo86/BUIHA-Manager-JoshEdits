import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Transactions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Transaction history will be available soon.</p>
      </CardContent>
    </Card>
  );
};