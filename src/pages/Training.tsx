import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeam } from "@/context/TeamContext";
import { TrendingUp } from "lucide-react";

const Training = () => {
  const { currentDate } = useTeam();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training & Development</h1>
          <p className="text-lg text-muted-foreground">
            Current Date: {currentDate.month} {currentDate.year}, Week {currentDate.week}
          </p>
        </div>
        <TrendingUp className="h-10 w-10 text-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Development</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Each week, players automatically have a chance to improve their attributes based on their age, potential, and work ethic (professionalism and determination). Younger players with high potential and a strong work ethic are more likely to see significant gains.
          </p>
          <p className="mt-4 text-muted-foreground">
            In the future, this screen will allow you to set specific training focuses for individual players or groups to target certain areas for improvement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Training;