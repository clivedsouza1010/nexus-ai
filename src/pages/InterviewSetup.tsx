import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAppStore } from '../store/useAppStore';
import { InterviewSession } from '../types';
import { ArrowLeft, Play, Upload, File, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { aiService } from '../services/aiService';

export default function InterviewSetup() {
  const navigate = useNavigate();
  const setCurrentSession = useAppStore(state => state.setCurrentSession);
  
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [roundType, setRoundType] = useState<InterviewSession['roundType']>('HR');
  const [difficulty, setDifficulty] = useState<InterviewSession['difficulty']>('Intermediate');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf" || file.type === "text/plain") {
        setResumeFile(file);
      } else {
        toast.error("Please upload a valid PDF or TXT file.");
      }
    }
  };

  const handleStart = async () => {
    if (!role || !company || !jobDescription) {
      toast.error('Please fill in all required fields.');
      return;
    }

    let extractedResumeText = undefined;
    if (resumeFile) {
      setIsExtracting(true);
      toast.info("Extracting resume data...");
      try {
        extractedResumeText = await aiService.extractResumeText(resumeFile);
        toast.success("Resume parsed successfully!");
      } catch (e) {
        toast.error("Failed to parse resume. Proceeding without it.");
      } finally {
        setIsExtracting(false);
      }
    }

    const newSession: InterviewSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      role,
      company,
      jobDescription,
      resumeText: extractedResumeText,
      roundType,
      difficulty,
      status: 'pending',
      transcript: []
    };

    setCurrentSession(newSession);
    navigate('/interview');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="pl-0 hover:bg-transparent hover:text-blue-600">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
        <CardHeader className="bg-white/5 border-b border-white/10 rounded-t-xl">
          <CardTitle className="text-3xl text-white">Configure Interview Session</CardTitle>
          <CardDescription className="text-lg text-white/60">Set up the parameters for your AI mock interview.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="role" className="text-base font-semibold text-white/90">Target Role <span className="text-cyan-400">*</span></Label>
                <Input 
                  id="role" 
                  placeholder="e.g. Senior Frontend Developer" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  className="h-12 bg-black/40 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-cyan-500"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="company" className="text-base font-semibold text-white/90">Company Name <span className="text-cyan-400">*</span></Label>
                <Input 
                  id="company" 
                  placeholder="e.g. Acme Corp" 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)} 
                  className="h-12 bg-black/40 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-cyan-500"
                />
              </div>
           </div>

           <div className="space-y-3">
             <Label htmlFor="jobDescription" className="text-base font-semibold text-white/90">Job Description <span className="text-cyan-400">*</span></Label>
             <Textarea 
               id="jobDescription" 
               placeholder="Paste the job requirements and responsibilities here. The AI will use this to generate relevant questions." 
               className="min-h-[200px] resize-y bg-black/40 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-cyan-500"
               value={jobDescription}
               onChange={(e) => setJobDescription(e.target.value)}
             />
           </div>

           <div className="space-y-3">
             <Label className="text-base font-semibold text-white/90">Resume (Optional)</Label>
             <div className="border-2 border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center bg-white/5 transition-colors hover:bg-white/10">
                {!resumeFile ? (
                  <>
                    <Upload className="w-10 h-10 text-white/40 mb-3" />
                    <p className="text-sm text-white/60 text-center mb-4">
                      Upload your resume (PDF or TXT) to get personalized questions tailored to your experience.
                    </p>
                    <input 
                      type="file" 
                      accept=".pdf,.txt" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => fileInputRef.current?.click()}>
                      Browse Files
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <File className="w-12 h-12 text-cyan-500 mb-2" />
                    <p className="text-sm font-medium text-white mb-1">{resumeFile.name}</p>
                    <p className="text-xs text-white/40 mb-4">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={() => setResumeFile(null)}>
                      <X className="w-4 h-4 mr-1" /> Remove
                    </Button>
                  </div>
                )}
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold text-white/90">Round Type</Label>
                <Select value={roundType} onValueChange={(v) => setRoundType(v as any)}>
                  <SelectTrigger className="h-12 bg-black/40 border-white/10 text-white focus:ring-cyan-500">
                    <SelectValue placeholder="Select round type" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    <SelectItem value="HR">HR / Behavioral</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Case Study">Case Study</SelectItem>
                    <SelectItem value="Live Coding">Live Coding</SelectItem>
                    <SelectItem value="Design">System Design</SelectItem>
                    <SelectItem value="Leadership">Leadership</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold text-white/90">Difficulty</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                  <SelectTrigger className="h-12 bg-black/40 border-white/10 text-white focus:ring-cyan-500">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
           </div>
        </CardContent>
        <CardFooter className="bg-white/5 border-t border-white/10 rounded-b-xl py-6 flex justify-end">
           <Button onClick={handleStart} disabled={isExtracting} size="lg" className="px-8 text-lg bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all border border-cyan-400/50">
             {isExtracting ? (
               <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing...</>
             ) : (
               <>Start Interview <Play className="ml-2 w-5 h-5" /></>
             )}
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
