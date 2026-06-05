// const mongoose = require('mongoose');

// /**
//  * - job description schema : string
//  * - resume text : string
//  * - self description :string
//  * 
//  * - matchScore : number
//  * 
//  * - Technical questions :[ 
//  * {
//  *  question: "What is a closure in JavaScript?",
//  *  intention: "To assess the candidate's understanding of closures and their ability to explain complex concepts clearly.",
//  *  answer: "A closure is a function that has access to its own scope, the outer function's scope, and the global scope. It allows a function to access variables from an enclosing scope even after it has returned."
//  * }
//  * ]
//  * - Behavioral questions :[{
//  *  question: "Can you describe a time when you had to work under pressure?",
//  * intention: "To evaluate the candidate's ability to handle stressful situations and their problem-solving skills.",
//  * answer: "In my previous role, I had to meet a tight deadline for a project. I prioritized my tasks, communicated effectively with my team, and stayed focused to ensure we delivered the project on time without compromising quality."
//  * }]
//  * - Skill gaps :[{
//  *            skill: "React",
//  *            severity: { type: String,
//  *            enum: ['low', 'medium', 'high'] },       
//  *              }]
//  * - preparation plans :[{
//  *             day: Number,
//  *             focus: String,
//  *            task: [String]
//  *                    }]
//  */



// const technicalQuestionSchema = new mongoose.Schema({
//     question: { 
//         type: String, required: [true, 'Question is required'] 
//     },
//     intention: { 
//         type: String, required: [true, 'Intention is required'] 
//     },
//     answer: {
//          type: String, required: [true, 'Answer is required'] 
//         }
// },{
//     _id: false
// });

// const behavioralQuestionSchema = new mongoose.Schema(
//         {
//             question: { 
//                 type: String, required: [true, 'Question is required'] 
//             },
//             intention: { 
//                 type: String, required: [true, 'Intention is required'] 
//             },
//             answer: { 
//                 type: String, required: [true, 'Answer is required'] 
//             }
//         },{
//     _id: false
//         }
//     );

//     const skillGapSchema = new mongoose.Schema({
//     skill: { 
//         type: String, required: [true, 'Skill is required']
//         },
//     severity: {
//         type: String,
//         enum: ['low', 'medium', 'high'],
//         required: [true, 'Severity is required']
//     }
// },{
//     _id: false
// });
 

// const preparationPlanSchema = new mongoose.Schema({
//     day: { 
//         type: Number, required: [true, 'Day is required']
//         },
//     focus: { 
//         type: String, required: [true, 'Focus is required']
//         },
//     task: [{ 
//         type: String, required: [true, 'Task is required']
//         }]
// },{
//     _id: false
// });


// const interviewReportSchema = new mongoose.Schema({
//     jobDescription: { 
//         type: String, 
//         required: [true, 'Job description is required'] 
//     },
//     resumeText: {
//          type: String,
//           required: [true, 'Resume text is required'] 
//         },
//     selfDescription: {
//          type: String,
//           required: [true, 'Self description is required'] 
//         },
//     matchScore: {
//          type: Number, min: 0, max: 100,
//           required: [true, 'Match score is required'] 
//         },

//     technicalQuestions: [technicalQuestionSchema],
//     behavioralQuestions: [behavioralQuestionSchema],
//     skillGaps: [skillGapSchema],
//     preparationPlans: [preparationPlanSchema]

// }, { timestamps: true });   


// const InterviewReportModel = mongoose.model('InterviewReport', interviewReportSchema);

// const InterviewReport = mongoose.model('InterviewReport', interviewReportSchema);

// module.exports = InterviewReport;














/////////////////

const mongoose = require('mongoose');

const technicalQuestionSchema = new mongoose.Schema({
    question:  { type: String, required: [true, 'Question is required'] },
    intention: { type: String, required: [true, 'Intention is required'] },
    answer:    { type: String, required: [true, 'Answer is required'] }
}, { _id: false });

const behavioralQuestionSchema = new mongoose.Schema({
    question:  { type: String, required: [true, 'Question is required'] },
    intention: { type: String, required: [true, 'Intention is required'] },
    answer:    { type: String, required: [true, 'Answer is required'] }
}, { _id: false });

const skillGapSchema = new mongoose.Schema({
    skill:    { type: String, required: [true, 'Skill is required'] },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: [true, 'Severity is required'] }
}, { _id: false });

const preparationPlanSchema = new mongoose.Schema({
    day:   { type: Number, required: [true, 'Day is required'] },
    focus: { type: String, required: [true, 'Focus is required'] },
    task:  [{ type: String, required: [true, 'Task is required'] }]
}, { _id: false });

const interviewReportSchema = new mongoose.Schema({
    jobDescription:   { type: String, required: [true, 'Job description is required'] },
    resumeText:       { type: String },
    selfDescription:  { type: String },
    matchScore:       { type: Number, min: 0, max: 100, required: [true, 'Match score is required'] },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps:          [skillGapSchema],
    preparationPlans:   [preparationPlanSchema],
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "users"
    }

}, { timestamps: true });

// ✅ Only register once
const InterviewReport = mongoose.model('InterviewReport', interviewReportSchema);

module.exports = InterviewReport;