// const { GoogleGenAI } = require( "@google/genai");
// const { z } = require("zod");
// const { zodToJsonSchema } = require("zod-to-json-schema");

// const ai = new GoogleGenAI({
//     apiKey: process.env.GOOGLE_GEMINI_API_KEY,
// });


// const interviewReportSchema = z.object({
//     matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's resume and self-describe match the job describe"),
//     technicalQuestions: z.array(z.object({
//         question: z.string().describe("The technical question asked during the interview"),
//          intention: z.string().describe("The intention behind the technical question"),
//          answer: z.string().describe("The answer to the technical question"),
       
//     })).describe("An array of technical questions asked during the interview, along with their intentions and answers"),

//     behavioralQuestions: z.array(z.object({
//         question: z.string().describe("The behavioral question asked during the interview"),
//          intention: z.string().describe("The intention behind the behavioral question"),
//          answer: z.string().describe("The answer to the behavioral question"),

//     })).describe("An array of behavioral questions asked during the interview, along with their intentions and answers"),

//     skillGaps: z.array(z.object({
//         skill: z.string().describe("The skill that the candidate is lacking"),
//         importance: z.string().describe("The importance of the skill for the job"),

//     })).describe("An array of skill gaps identified during the interview, along with their importance for the job"),

//     preparationPlan: z.array(z.object({
//         action: z.string().describe("The action that the candidate should take to prepare for future interviews"),
//         resources: z.array(z.string()).describe("An array of resources that the candidate can use to prepare for future interviews"),

//     })).describe("A preparation plan for the candidate, including actions to take and resources to use"),    

    
// });


// async function generateInterviewReport({resume, selfDescription, jobDescription}){

//     const prompt = `Generate an interview report based on the following 
//     resume${resume}, self-description ${selfDescription}, and job description ${jobDescription}. 
//     The report should include a match score, technical questions, behavioral questions, skill gaps, and a preparation plan for the candidate.
//      The report should be in JSON format and follow the schema defined below.`

//     const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash",
//         content: prompt,
//         config:{
//             responseMineType:".../json",
//             responseJsonSchema: zodToJsonSchema(interviewReportSchema),
//         }
//     });
//    return JSON.parse(response.text);
// };
 

// module.exports = {
//     generateInterviewReport
// }










/////////////////////////

const Groq = require("groq-sdk");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const interviewReportSchema = z.object({
    matchScore: z.number()
        .describe("A score between 0 and 100 indicating how well the candidate matches the job"),

    technicalQuestions: z.array(z.object({
        question:  z.string().describe("The technical question"),
        intention: z.string().describe("The intention behind the question"),
        answer:    z.string().describe("A strong answer to the question"),
    })).describe("Technical questions with intentions and model answers"),

    behavioralQuestions: z.array(z.object({
        question:  z.string().describe("The behavioral question"),
        intention: z.string().describe("The intention behind the question"),
        answer:    z.string().describe("A strong STAR-format answer"),
    })).describe("Behavioral questions with intentions and model answers"),

    skillGaps: z.array(z.object({
        skill:    z.string().describe("The skill the candidate is lacking"),
        severity: z.enum(['low', 'medium', 'high']).describe("How critical this gap is for the role"),
    })).describe("Skill gaps identified by comparing resume to job description"),

    preparationPlans: z.array(z.object({
        day:   z.number().describe("Day number in the preparation schedule"),
        focus: z.string().describe("The main topic or theme for the day"),
        task:  z.array(z.string()).describe("Specific tasks to complete on this day"),
    })).describe("A day-by-day preparation plan for the candidate"),
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `You are an expert career coach. Generate a COMPLETE interview report in valid JSON format.

Resume: ${resume}

Self-Description: ${selfDescription}

Job Description: ${jobDescription}

CRITICAL: Return ONLY a JSON object (no markdown, no code fences). Every field must be present and have the correct type. Follow this exact structure:

{
  "matchScore": <number 0-100>,
  "technicalQuestions": [
    {
      "question": "<string>",
      "intention": "<string>",
      "answer": "<string - detailed answer>"
    },
    ... (5 total)
  ],
  "behavioralQuestions": [
    {
      "question": "<string>",
      "intention": "<string>",
      "answer": "<string - STAR format answer>"
    },
    ... (5 total)
  ],
  "skillGaps": [
    {
      "skill": "<string>",
      "severity": "low|medium|high"
    }
  ],
  "preparationPlans": [
    {
      "day": <number 1-7>,
      "focus": "<string - day theme>",
      "task": ["<string>", "<string>"]
    },
    ... (7 total for days 1-7)
  ]
}`;

    try {
        console.log('AI prompt length:', prompt.length);

        // ✅ Correct Groq SDK call
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            max_tokens: 3000,
            temperature: 0.3,
            messages: [
                { role: "system", content: "You are an expert career coach. Always respond with valid JSON only." },
                { role: "user", content: prompt }
            ],
        });

        // ✅ Correct way to extract text from Groq response
        const rawText = response.choices[0].message.content;
        console.log('Raw response preview:', rawText.slice(0, 200));

        // Strip accidental markdown fences if any
        const cleaned = rawText.replace(/```json|```/g, "").trim();

        const parsed = JSON.parse(cleaned);
        
        // Ensure all required fields are present - fill defaults if missing
        const ensuredData = {
            matchScore: parsed.matchScore || 50,
            technicalQuestions: (parsed.technicalQuestions || []).map((q, i) => ({
                question: q.question || `Technical question ${i + 1}`,
                intention: q.intention || `Assess technical skill ${i + 1}`,
                answer: q.answer || `Example answer for technical question ${i + 1}`,
            })),
            behavioralQuestions: (parsed.behavioralQuestions || []).map((q, i) => ({
                question: q.question || `Behavioral question ${i + 1}`,
                intention: q.intention || `Assess past behavior ${i + 1}`,
                answer: q.answer || `Example STAR answer for behavioral question ${i + 1}`,
            })),
            skillGaps: (parsed.skillGaps || []).map(gap => ({
                skill: gap.skill || 'Unspecified skill',
                severity: ['low', 'medium', 'high'].includes(gap.severity) ? gap.severity : 'medium',
            })),
            preparationPlans: (parsed.preparationPlans || Array.from({ length: 7 }).map((_, i) => ({
                day: i + 1,
                focus: `Day ${i + 1} focus`,
                task: [`Task A`, `Task B`],
            }))).slice(0, 7),
        };
        
        return interviewReportSchema.parse(ensuredData);

    } catch (err) {
        console.error('Error generating interview report:', err);

        const status = err?.status;
        const errorMessage = err?.error?.error?.message || err?.message || '';

        // Check for rate limit (429) or insufficient credits (400)
        const isRateLimited = status === 429;
        const isInsufficientCredits = status === 400 && (errorMessage.includes('credit balance') || errorMessage.includes('quota'));

        if (isRateLimited || isInsufficientCredits) {
            console.warn(`Groq API unavailable (${isRateLimited ? 'rate limited' : 'quota exceeded'}) — returning development fallback report.`);

            const fallback = {
                matchScore: 55,
                technicalQuestions: Array.from({ length: 5 }).map((_, i) => ({
                    question: `Technical question ${i + 1}`,
                    intention: `Assess core concept ${i + 1}`,
                    answer: `Example strong answer for technical question ${i + 1}`,
                })),
                behavioralQuestions: Array.from({ length: 5 }).map((_, i) => ({
                    question: `Behavioral question ${i + 1}`,
                    intention: `Assess past behavior ${i + 1}`,
                    answer: `Example STAR-format answer for behavioral question ${i + 1}`,
                })),
                skillGaps: [
                    { skill: 'System Design', severity: 'medium' },
                ],
                preparationPlans: Array.from({ length: 7 }).map((_, i) => ({
                    day: i + 1,
                    focus: `Day ${i + 1} focus area`,
                    task: [`Task A for day ${i + 1}`, `Task B for day ${i + 1}`],
                })),
            };

            return interviewReportSchema.parse(fallback);
        }

        throw err;
    }
}
module.exports = { generateInterviewReport };

// Simple resume PDF generator for download (optional dependency)
let PDFDocument = null
try {
    PDFDocument = require('pdfkit')
} catch (e) {
    console.warn('Optional dependency "pdfkit" not installed — resume PDF generation disabled. Install with `npm install pdfkit` to enable.')
}

async function generateResumePdf({ resume, jobDescription, selfDescription }) {
    if (!PDFDocument) {
        // Fallback: return a plain-text buffer so the endpoint doesn't crash.
        const text = `PDF generator not available. Install pdfkit for full resume PDF support.\n\nResume:\n${resume ? resume.substring(0, 10000) : '<none>'}\n\nSelf Description:\n${selfDescription || '<none>'}\n\nJob Description:\n${jobDescription ? jobDescription.substring(0, 5000) : '<none>'}`
        return Buffer.from(text, 'utf-8')
    }

    const doc = new PDFDocument()
    const buffers = []
    doc.on('data', buffers.push.bind(buffers))
    return new Promise((resolve, reject) => {
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers)
            resolve(pdfData)
        })
        doc.on('error', reject)

        doc.fontSize(16).text('Generated Resume', { underline: true })
        doc.moveDown()
        if (resume) {
            doc.fontSize(12).text('Resume Text:')
            doc.fontSize(10).text(resume.substring(0, 10000))
            doc.moveDown()
        }
        if (selfDescription) {
            doc.fontSize(12).text('Self Description:')
            doc.fontSize(10).text(selfDescription)
            doc.moveDown()
        }
        if (jobDescription) {
            doc.fontSize(12).text('Job Description:')
            doc.fontSize(10).text(jobDescription.substring(0, 5000))
        }

        doc.end()
    })
}

module.exports = { generateInterviewReport, generateResumePdf }