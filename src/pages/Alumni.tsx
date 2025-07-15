import { useTeam } from '@/context/TeamContext';
import { AlumniTable } from '@/components/alumni/AlumniTable';

const AlumniPage = () => {
  const { alumni } = useTeam();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alumni Tracker</h1>
        <p className="text-lg text-muted-foreground">
          Track the careers of players who have graduated from your organization.
        </p>
      </div>
      <AlumniTable alumni={alumni} />
    </div>
  );
};

export default AlumniPage;