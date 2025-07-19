import { useTeam } from '@/context/TeamContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScoutingTable } from '@/components/recruitment/ScoutingTable';
import { RecruitsTable } from '@/components/recruitment/RecruitsTable';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Player, Position } from '@/types';

const qualityOrder: (Player['estimatedQuality'])[] = ['Beginner', 'Moderate', 'Intermediate', 'Experienced', 'Elite'];

const Recruitment = () => {
  const { userTeam, scoutingPool, recruitedPool, transferPool } = useTeam();
  const recruitingBudget = userTeam?.financials.discretionaryBudget;

  // Filter state
  const [qualityFilter, setQualityFilter] = useState('All');
  const [positionFilter, setPositionFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  // Added optional chaining to prevent error if pools are undefined
  if (!userTeam || (scoutingPool?.length === 0 && recruitedPool?.length === 0 && transferPool?.length === 0)) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-4">Recruitment</h1>
        <p className="text-lg text-muted-foreground">
          There are no players to scout right now. Host the student fair from the Dashboard to find new talent.
        </p>
      </div>
    );
  }

  const uniqueQualities = ['All', ...qualityOrder];
  const positionCategories = ['All', 'Forward', 'Defence', 'Goaltender'];
  // Added optional chaining and nullish coalescing for safety
  const uniqueSources = ['All', ...Array.from(new Set(scoutingPool?.map(p => p.source) || []))];
  const forwardPositions: Position[] = ['C', 'LW', 'RW'];
  const defencePositions: Position[] = ['LD', 'RD'];

  // Added optional chaining and nullish coalescing for safety
  const filteredScoutingPool = scoutingPool?.filter(player => {
    if (qualityFilter !== 'All' && player.estimatedQuality !== qualityFilter) {
      return false;
    }
    if (positionFilter !== 'All') {
      const isForward = forwardPositions.some(p => player.positions.includes(p));
      const isDefence = defencePositions.some(p => player.positions.includes(p));
      const isGoaltender = player.positions.includes('G');

      if (positionFilter === 'Forward' && !isForward) return false;
      if (positionFilter === 'Defence' && !isDefence) return false;
      if (positionFilter === 'Goaltender' && !isGoaltender) return false;
    }
    if (sourceFilter !== 'All' && player.source !== sourceFilter) {
      return false;
    }
    return true;
  }) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recruitment</h1>
          <p className="text-lg text-muted-foreground">
            Find the next generation of talent for your team.
          </p>
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recruiting Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{recruitingBudget?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="scouting" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scouting">Scouting Pool</TabsTrigger>
          <TabsTrigger value="transfer">Transfer Portal</TabsTrigger>
          <TabsTrigger value="recruits">Your Recruits</TabsTrigger>
        </TabsList>
        <TabsContent value="scouting" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Scouting Pool</CardTitle>
              <CardDescription>
                Potential players from the student fair. Their exact abilities are unknown until you recruit them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quality-filter">Est. Quality</Label>
                    <Select value={qualityFilter} onValueChange={setQualityFilter}>
                      <SelectTrigger id="quality-filter">
                        <SelectValue placeholder="Filter by quality" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueQualities.map((q) => <SelectItem key={q} value={q as string}>{q}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position-filter">Position</Label>
                    <Select value={positionFilter} onValueChange={setPositionFilter}>
                      <SelectTrigger id="position-filter">
                        <SelectValue placeholder="Filter by position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positionCategories.map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source-filter">Source</Label>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger id="source-filter">
                        <SelectValue placeholder="Filter by source" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              <ScoutingTable data={filteredScoutingPool} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transfer" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Portal</CardTitle>
              <CardDescription>
                Players who have graduated from other universities and are looking for a new team. Their recruitment cost is free due to your program's prestige.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transferPool?.length > 0 ? (
                <ScoutingTable data={transferPool} />
              ) : (
                <p className="text-muted-foreground text-center py-8">The Transfer Portal is currently empty. Check back at the start of next season.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recruits" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Recruits</CardTitle>
              <CardDescription>
                Players you have recruited. Review their full profile and decide whether to assign them to your roster or discard them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecruitsTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Recruitment;