import { NationalsTournament } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import NationalsGroupCard from '@/components/nationals/NationalsGroupCard';
import NationalsPlayoffTree from '@/components/nationals/NationalsPlayoffTree';

interface NationalsHistoryViewProps {
  nationalsDataForYear: { [division: string]: NationalsTournament } | null;
}

const NationalsHistoryView = ({ nationalsDataForYear }: NationalsHistoryViewProps) => {
  if (!nationalsDataForYear || Object.keys(nationalsDataForYear).length === 0) {
    return <p className="text-center text-muted-foreground py-8">No Nationals history available for the selected season.</p>;
  }

  const divisions = Object.keys(nationalsDataForYear).sort();

  return (
    <Accordion type="single" collapsible className="w-full" defaultValue={divisions[0]}>
      {divisions.map(divisionName => {
        const tournament = nationalsDataForYear[divisionName];
        if (!tournament) return null;

        const goldBracket = tournament.playoffSchedule.filter(m => m.bracket === 'Gold');
        const silverBracket = tournament.playoffSchedule.filter(m => m.bracket === 'Silver');

        return (
          <AccordionItem key={divisionName} value={divisionName}>
            <AccordionTrigger className="text-lg font-semibold">{divisionName} Nationals</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-12">
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-center">Group Stage</h3>
                  {tournament.groups.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {tournament.groups.map(group => (
                        <NationalsGroupCard key={group.name} group={group} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No group stage data available.</p>
                  )}
                </div>
                
                { (goldBracket.length > 0 || silverBracket.length > 0) &&
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-center">Playoffs</h3>
                    <div className="space-y-8">
                      {goldBracket.length > 0 && (
                        <NationalsPlayoffTree
                          bracket="Gold"
                          playoffSchedule={goldBracket}
                          teams={[]}
                          userTeamName={undefined}
                          onPlayGame={() => {}}
                          onSimulateGame={() => {}}
                          onSimulateSingleGame={() => {}}
                        />
                      )}
                      {silverBracket.length > 0 && (
                        <NationalsPlayoffTree
                          bracket="Silver"
                          playoffSchedule={silverBracket}
                          teams={[]}
                          userTeamName={undefined}
                          onPlayGame={() => {}}
                          onSimulateGame={() => {}}
                          onSimulateSingleGame={() => {}}
                        />
                      )}
                    </div>
                  </div>
                }
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default NationalsHistoryView;