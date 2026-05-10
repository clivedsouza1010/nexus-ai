import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, ChevronRight, Target, Lightbulb, BookOpen } from 'lucide-react';

export default function InterviewReport() {
  const navigate = useNavigate();
  // We look at the most recent session in pastSessions for the report
  const pastSessions = useAppStore(state => state.pastSessions);
  const latestSession = pastSessions[0];

  if (!latestSession || !latestSession.report) {
    return (
      <div className="container mx-auto p-6 text-center mt-20">
        <h2 className="text-2xl font-bold mb-4">No report found.</h2>
        <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
      </div>
    );
  }

  const { report, role, company, roundType, difficulty } = latestSession;

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const progressColorClass = (score: number) => {
      if (score >= 80) return 'bg-green-500';
      if (score >= 60) return 'bg-yellow-500';
      return 'bg-red-500';
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">Interview Analysis</h1>
          <p className="text-lg text-slate-500 mt-2">{role} at {company} &bull; {roundType} ({difficulty})</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1 md:col-span-3 lg:col-span-1 bg-slate-900 text-white border-none shadow-xl flex flex-col items-center justify-center py-10">
           <h3 className="text-slate-400 font-medium mb-2 uppercase tracking-widest text-sm">Overall Score</h3>
           <div className="text-7xl font-black mb-4">
               <span className={scoreColor(report.overallScore)}>{report.overallScore}</span><span className="text-slate-600 text-4xl">/100</span>
           </div>
           <p className="text-slate-300 px-6 text-center text-sm leading-relaxed">
             {report.feedback}
           </p>
        </Card>

        <Card className="col-span-1 md:col-span-2 shadow-md border-slate-200 dark:border-slate-800">
          <CardHeader>
             <CardTitle>Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
             <div>
               <div className="flex justify-between font-semibold mb-2">
                 <span>Communication</span>
                 <span className={scoreColor(report.communicationScore)}>{report.communicationScore}%</span>
               </div>
               <Progress value={report.communicationScore} className="h-3 bg-slate-100 dark:bg-slate-800" indicatorClassName={progressColorClass(report.communicationScore)} />
             </div>
             <div>
               <div className="flex justify-between font-semibold mb-2">
                 <span>Technical / Role Fit</span>
                 <span className={scoreColor(report.technicalDepthScore)}>{report.technicalDepthScore}%</span>
               </div>
               <Progress value={report.technicalDepthScore} className="h-3 bg-slate-100 dark:bg-slate-800" indicatorClassName={progressColorClass(report.technicalDepthScore)} />
             </div>
             <div>
               <div className="flex justify-between font-semibold mb-2">
                 <span>Confidence & Delivery</span>
                 <span className={scoreColor(report.bodyLanguageScore)}>{report.bodyLanguageScore}%</span>
               </div>
               <Progress value={report.bodyLanguageScore} className="h-3 bg-slate-100 dark:bg-slate-800" indicatorClassName={progressColorClass(report.bodyLanguageScore)} />
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-green-100 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-400 flex items-center gap-2">
               <CheckCircle2 className="w-5 h-5" /> Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="space-y-3">
               {report.strengths.map((str, idx) => (
                 <li key={idx} className="flex items-start text-green-900 dark:text-green-100">
                    <ChevronRight className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{str}</span>
                 </li>
               ))}
             </ul>
          </CardContent>
        </Card>

        <Card className="border-orange-100 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-400 flex items-center gap-2">
               <Target className="w-5 h-5" /> Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="space-y-3">
               {report.areasForImprovement.map((area, idx) => (
                 <li key={idx} className="flex items-start text-orange-900 dark:text-orange-100">
                    <ChevronRight className="w-5 h-5 text-orange-500 mr-2 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{area}</span>
                 </li>
               ))}
             </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-400 flex items-center gap-2">
               <BookOpen className="w-5 h-5" /> Suggested Resources
            </CardTitle>
            <CardDescription className="text-blue-600/80 dark:text-blue-300">Based on your performance, we recommend the following focus areas:</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="grid sm:grid-cols-2 gap-4">
               {report.suggestedResources.map((res, idx) => (
                 <div key={idx} className="flex items-start bg-white dark:bg-slate-950 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 shadow-sm">
                    <Lightbulb className="w-5 h-5 text-blue-500 mr-3 shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{res}</span>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
