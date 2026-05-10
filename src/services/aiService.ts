import { GoogleGenAI } from "@google/genai";
import { InterviewSession, TranscriptMessage, InterviewReportData } from '../types';

// We must lazy initialize the client to prevent crash if key is missing initially
let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export const aiService = {
  async extractResumeText(file: File): Promise<string> {
    const ai = getAiClient();
    
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const b64 = result.split(',')[1];
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: "Extract all text from this resume, preserving the structure as best as possible. Output only the resume text." },
          { 
            inlineData: {
              data: base64,
              mimeType: file.type || "application/pdf"
            }
          }
        ]
      });
      return response.text || "";
    } catch (error) {
      console.error("AI Error parsing resume: ", error);
      throw error;
    }
  },

  async generateFirstQuestion(session: InterviewSession): Promise<string> {
    const ai = getAiClient();
    const prompt = `
      You are an expert HR and technical interviewer. You are conducting a "${session.roundType}" round interview for a "${session.role}" position at "${session.company}".
      The difficulty level is ${session.difficulty}.
      Here is the job description:
      ${session.jobDescription}
      
      ${session.resumeText ? `Here is the candidate's resume:\n${session.resumeText}\n\nPlease tailor your first question based on their resume if relevant.` : ""}

      Based on this, start the interview by greeting the candidate and asking the very first interview question. Keep it natural and conversational. DO NOT OUTPUT ANYTHING ELSE.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });
      return response.text || "Hello! Let's start the interview. Can you tell me a little about yourself?";
    } catch (error) {
      console.error("AI Error getting first question: ", error);
      return "Hello! I am having some connection issues, but let's begin. Please introduce yourself.";
    }
  },

  async generateNextQuestionOrFeedback(
    session: InterviewSession,
    transcript: TranscriptMessage[]
  ): Promise<string> {
    const ai = getAiClient();
    
    let conversationHistory = transcript.map(m => `${m.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.text}`).join('\n');

    const prompt = `
      You are an expert HR and technical interviewer. You are conducting a "${session.roundType}" round interview for a "${session.role}" position at "${session.company}".
      The difficulty level is ${session.difficulty}.
      Job Description: ${session.jobDescription}
      
      ${session.resumeText ? `Candidate's Resume:\n${session.resumeText}\n` : ""}

      Here is the transcript of the interview so far:
      ${conversationHistory}

      You are the Interviewer. The Candidate just spoke. Respond to what they said, provide brief real-time feedback if they struggled slightly (to guide them), and then move on to the next relevant question. If they answered perfectly, acknowledge it and ask the next question.
      Keep it conversational, professional, and do not break character. Do not output anything other than what you will say next.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          temperature: 0.8,
        }
      });
      return response.text || "Thank you for that response. Let's move on to the next question.";
    } catch (error) {
      console.error("AI Error getting next response: ", error);
      return "Thanks. Could you elaborate a bit more on your previous experience?";
    }
  },

  async generateInterviewReport(session: InterviewSession, transcript: TranscriptMessage[]): Promise<InterviewReportData> {
     const ai = getAiClient();
     let conversationHistory = transcript.map(m => `${m.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.text}`).join('\n');

     const prompt = `
      You are an expert Interview Coach. You have just observed an interview.
      Role: ${session.role}
      Round: ${session.roundType}
      Difficulty: ${session.difficulty}

      Interview Transcript:
      ${conversationHistory}

      Analyze the candidate's performance. Focus on communication, technical depth (if applicable to round/role), and overall impact.
      Return the analysis strictly as a JSON object with the following schema:
      {
        "overallScore": <number 0-100>,
        "communicationScore": <number 0-100>,
        "technicalDepthScore": <number 0-100>,
        "bodyLanguageScore": <number 0-100, if transcript seems nervous or confident based on text, estimate from 70-100>,
        "feedback": "<general feedback paragraph>",
        "strengths": ["<strength 1>", "<strength 2>"],
        "areasForImprovement": ["<area 1>", "<area 2>"],
        "suggestedResources": ["<resource 1>", "<resource 2>"]
      }
     `;

     try {
       const response = await ai.models.generateContent({
         model: "gemini-3.1-pro-preview",
         contents: prompt,
         config: {
           responseMimeType: "application/json",
         }
       });
       if(response.text) {
          return JSON.parse(response.text) as InterviewReportData;
       }
       throw new Error("Empty response");
     } catch(e) {
       console.error("AI Error generating report: ", e);
       return {
         overallScore: 0,
         communicationScore: 0,
         technicalDepthScore: 0,
         bodyLanguageScore: 0,
         feedback: "Failed to generate AI report due to an error.",
         strengths: [],
         areasForImprovement: [],
         suggestedResources: []
       }
     }
  }
};
