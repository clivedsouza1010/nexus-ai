export interface InterviewSession {
  id: string;
  date: string;
  role: string;
  company: string;
  jobDescription: string;
  resumeText?: string;
  roundType: 'HR' | 'Technical' | 'Case Study' | 'Live Coding' | 'Design' | 'Leadership';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  status: 'pending' | 'in-progress' | 'completed';
  transcript: TranscriptMessage[];
  report?: InterviewReportData;
}

export interface TranscriptMessage {
  id: string;
  speaker: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

export interface InterviewReportData {
  overallScore: number;
  communicationScore: number;
  technicalDepthScore: number;
  bodyLanguageScore: number; // For future when camera is integrated fully
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
  suggestedResources: string[];
}
