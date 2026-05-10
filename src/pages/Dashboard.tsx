import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, PlusCircle, History, BarChart3, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const pastSessions = useAppStore(state => state.pastSessions);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          NexusAI <span className="text-blue-600 dark:text-blue-500">Interviewer</span>
        </h1>
        <p className="mt-4 text-xl text-slate-500 dark:text-slate-400">
          Practice, perfect, and land your dream job with AI-driven interview coaching.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900 border-blue-100 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <PlayCircle className="text-blue-600 dark:text-blue-400" />
              Start a New Interview
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400">
              Configure a new interview session tailored to your target role and practicing needs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/setup')} size="lg" className="w-full sm:w-auto mt-4 px-8 py-6 text-lg rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="mr-2 h-5 w-5" /> Setup Session
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="text-indigo-600 dark:text-indigo-400" />
              Your Progress
            </CardTitle>
            <CardDescription>Average performance</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            {pastSessions.length > 0 ? (
              <div className="text-center">
                 <div className="text-5xl font-bold text-slate-900 dark:text-white">
                   {Math.round(pastSessions.reduce((acc, curr) => acc + (curr.report?.overallScore || 0), 0) / pastSessions.length)}<span className="text-2xl text-slate-400">/100</span>
                 </div>
                 <p className="mt-2 text-sm text-slate-500">Across {pastSessions.length} session{pastSessions.length !== 1 ? 's' : ''}</p>
                 <Button onClick={() => navigate('/report')} variant="outline" className="mt-4">
                   View Latest Full Report
                 </Button>
              </div>
            ) : (
              <div className="text-center text-slate-500">
                 <div className="text-4xl font-light mb-2">--</div>
                 <p>Complete an interview to see your stats.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <History className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Sessions</h2>
        </div>

        {pastSessions.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
             <p className="text-lg text-slate-500 dark:text-slate-400">No past sessions found. Start practicing to build your history!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pastSessions.map((session) => (
              <Card key={session.id} className="relative overflow-hidden transition-all hover:shadow-md border-slate-200 dark:border-slate-800">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{session.role}</CardTitle>
                      <CardDescription>{session.company}</CardDescription>
                    </div>
                    <div className="text-right">
                       <span className="text-2xl font-bold text-slate-900 dark:text-white">{session.report?.overallScore || 0}</span>
                       <span className="text-slate-500">/100</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">{session.roundType}</Badge>
                    <Badge variant="outline">{session.difficulty}</Badge>
                    <div className="flex items-center text-xs text-slate-500 ml-auto">
                       <Clock className="w-3 h-3 mr-1" />
                       {new Date(session.date).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
