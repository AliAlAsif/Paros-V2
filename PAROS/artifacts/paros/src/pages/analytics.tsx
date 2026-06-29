import { useGetStudyHoursAnalytics, useGetSubjectDistribution } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from "date-fns";
import { BrainCircuit, Timer, FlaskConical } from "lucide-react";

export default function Analytics() {
  const { data: analytics, isLoading: analyticsLoading } = useGetStudyHoursAnalytics({ period: 'daily' });
  const { data: distribution, isLoading: distributionLoading } = useGetSubjectDistribution();

  if (analyticsLoading || distributionLoading || !analytics || !distribution) {
    return <div className="p-8">Loading analytics...</div>;
  }

  // Format data for Recharts
  const chartData = analytics.data.map(d => ({
    label: d.label,
    Study: d.studyMinutes / 60,
    Research: d.researchMinutes / 60,
  }));

  const pieData = distribution.map(d => ({
    name: d.subjectName,
    value: d.totalMinutes / 60,
    color: d.color
  }));

  const totalStudyHours = (analytics.totalStudyMinutes / 60).toFixed(1);
  const totalResearchHours = (analytics.totalResearchMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your academic performance and time investment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Study (30d)</p>
                <h3 className="text-3xl font-bold font-mono mt-2">{totalStudyHours}h</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><Timer className="w-5 h-5"/></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Research (30d)</p>
                <h3 className="text-3xl font-bold font-mono mt-2">{totalResearchHours}h</h3>
              </div>
              <div className="p-2 bg-secondary rounded-lg text-secondary-foreground"><FlaskConical className="w-5 h-5"/></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">7-Day Avg</p>
                <h3 className="text-3xl font-bold font-mono mt-2">{(analytics.rolling7DayAvgMinutes / 60).toFixed(1)}h/d</h3>
              </div>
              <div className="p-2 bg-muted rounded-lg text-muted-foreground"><BrainCircuit className="w-5 h-5"/></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">30-Day Avg</p>
                <h3 className="text-3xl font-bold font-mono mt-2">{(analytics.rolling30DayAvgMinutes / 60).toFixed(1)}h/d</h3>
              </div>
              <div className="p-2 bg-muted rounded-lg text-muted-foreground"><BrainCircuit className="w-5 h-5"/></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hours Over Time</CardTitle>
            <CardDescription>Daily study and research hours for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResearch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="Research" stackId="1" stroke="hsl(var(--chart-2))" fill="url(#colorResearch)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Study" stackId="1" stroke="hsl(var(--primary))" fill="url(#colorStudy)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Distribution</CardTitle>
            <CardDescription>Time spent per subject</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}h`, 'Time']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full space-y-2 mt-4 max-h-[150px] overflow-y-auto pr-2 scrollbar-thin">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="truncate max-w-[150px]">{d.name}</span>
                  </div>
                  <span className="font-mono text-muted-foreground">{d.value.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
