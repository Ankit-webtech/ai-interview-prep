// const pdfParse = require("pdf-parse");
// const { generateInterviewReport } = require("../services/ai.service");
// const interviewReportModel = require("../models/interviewReport.model");

// async function generateInterviewReportController(req, res) {
    

//     if (!req.file || !req.file.buffer) return res.status(400).json({ message: "Resume file is required" });
//     const pdfData = await pdfParse(req.file.buffer);
//     const resumeText = pdfData && pdfData.text ? pdfData.text : "";
//     const { selfDescription, jobDescription } = req.body;

//     const interviewReportByAi = await generateInterviewReport({
//         resume: resumeText,
//         selfDescription,
//         jobDescription
//     });

//     const interviewReport = await interviewReportModel.create({
//         user: req.user._id,
//         resume: resumeText,
//         selfDescription,
//         jobDescription,
//         ...interviewReportByAi
//     });

//     res.status(201).json({ message: "Interview report generated successfully", interviewReport });
   
// }

// module.exports = {
//     generateInterviewReportController
// };



const pdfParse = require("pdf-parse")
const mongoose = require("mongoose")
let mammoth = null
try {
    mammoth = require("mammoth")
} catch (e) {
    console.warn('Optional dependency "mammoth" not installed — DOCX parsing disabled. Install with `npm install mammoth` to enable .docx support.')
}

function parsePdfBuffer(buffer) {
    if (!pdfParse) throw new Error('pdf-parse not available')
    if (typeof pdfParse === 'function') return pdfParse(buffer)
    if (pdfParse && typeof pdfParse.default === 'function') return pdfParse.default(buffer)
    if (pdfParse && typeof pdfParse.PDFParse === 'function') {
        // pdf-parse may export a class that needs to be instantiated with `new` and exposes getText()
        try {
            const inst = new pdfParse.PDFParse(Uint8Array.from(buffer))
            if (typeof inst.getText === 'function') return inst.getText()
            return inst
        } catch (e) {
            // Last resort: try calling as a function
            return pdfParse(buffer)
        }
    }
    throw new Error('pdf-parse API not recognized')
}
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterviewReportController(req, res) {

    const { selfDescription, jobDescription } = req.body

    // Log decoded token payload (may contain `userId` depending on auth implementation)
    console.log('Incoming generateInterviewReport request:', { userPayload: req.user, bodyKeys: Object.keys(req.body), hasFile: !!req.file, fileInfo: req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : null })

    let resumeText = ""
    if (req.file && req.file.buffer) {
        try {
            const mimetype = req.file.mimetype || ''
            // If PDF
            if (mimetype.includes('pdf') || req.file.originalname?.toLowerCase().endsWith('.pdf')) {
                // pdf-parse expects a Buffer — use helper to accommodate different export shapes
                const data = await parsePdfBuffer(req.file.buffer)
                resumeText = data && data.text ? data.text : ""
            } else if (mimetype.includes('officedocument') || req.file.originalname?.toLowerCase().endsWith('.docx')) {
                // Use mammoth for .docx extraction (optional dependency)
                if (mammoth) {
                    try {
                        const result = await mammoth.extractRawText({ buffer: req.file.buffer })
                        resumeText = result && result.value ? result.value : ""
                    } catch (e) {
                        console.warn('mammoth parsing failed:', e?.message || e)
                        resumeText = ""
                    }
                } else {
                    console.warn('Received .docx but "mammoth" is not installed — skipping .docx parsing')
                    resumeText = ""
                }
            } else {
                // Unknown type: try pdf-parse as a last resort
                try {
                    const data = await pdfParse(req.file.buffer)
                    resumeText = data && data.text ? data.text : ""
                } catch (e) {
                    resumeText = ""
                }
            }
        } catch (err) {
            console.warn('Resume parsing failed, continuing without resumeText:', err?.message || err)
            resumeText = ""
        }
    }

    // Basic validation: require jobDescription and at least one of resumeText or selfDescription
    if (!jobDescription || (!req.file && !selfDescription)) {
        return res.status(400).json({ message: 'jobDescription and either resume or selfDescription are required.' })
    }

    try {
        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        })

        // Ensure DB field names match schema: `resumeText` and `preparationPlans`
        const userId = req.user?.userId || req.user?.id || req.user?._id || null
        console.log('Creating report with userId:', userId, 'from req.user:', req.user)
        const toCreate = {
            user: userId,
            resumeText,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        }

        // If AI service returned `preparationPlans` but schema expects `preparationPlans`, keep as-is.
        const interviewReport = await interviewReportModel.create(toCreate)
        console.log('Report created with ID:', interviewReport._id, 'User ID:', interviewReport.user)

        // add aliased fields for frontend compatibility
        const returned = interviewReport.toObject()
        if (returned.preparationPlans && !returned.preparationPlan) returned.preparationPlan = returned.preparationPlans

        // normalize day.tasks (frontend expects `tasks`)
        if (returned.preparationPlan && Array.isArray(returned.preparationPlan)) {
            returned.preparationPlan = returned.preparationPlan.map(d => ({ ...d, tasks: d.task || d.tasks || [] }))
        }

        return res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport: returned
        })
    } catch (err) {
        console.error("Error generating interview report:", err?.message || err)
        // If AI service is throttling, return 503 with guidance
        const status = err?.statusCode || err?.status || 502
        return res.status(status === 429 ? 429 : 503).json({ message: "Failed to generate interview report. Try again later." })
    }

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const userId = req.user?.userId || req.user?.id || req.user?._id || null
    console.log('Fetching report:', { interviewId, userId, userPayload: req.user })
    
    try {
        const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: userObjectId })

        if (!interviewReport) {
            console.warn(`Report not found: interviewId=${interviewId}, userId=${userId}`)
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const returned = interviewReport.toObject()
        if (returned.preparationPlans && !returned.preparationPlan) returned.preparationPlan = returned.preparationPlans

        if (returned.preparationPlan && Array.isArray(returned.preparationPlan)) {
            returned.preparationPlan = returned.preparationPlan.map(d => ({ ...d, tasks: d.task || d.tasks || [] }))
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport: returned
        })
    } catch (err) {
        console.error('Error fetching report:', err?.message || err)
        res.status(500).json({ message: 'Failed to fetch interview report' })
    }

}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const userId = req.user?.userId || req.user?.id || req.user?._id || null
        const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId
        const interviewReports = await interviewReportModel.find({ user: userObjectId }).sort({ createdAt: -1 }).select("-resumeText -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlans")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (err) {
        console.error('Error fetching reports:', err?.message || err)
        res.status(500).json({ message: 'Failed to fetch interview reports' })
    }
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resumeText, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume: resumeText, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)

}

module.exports = { generateInterviewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }