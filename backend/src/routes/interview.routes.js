const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const interviewRouter = express.Router();
const upload = require("../middlewares/file.middleware");

/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description, resume pdf and job description.
 * @access private
 */

interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterviewReportController);
// Get all interview reports for logged in user
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController);

// Get a single interview report by id
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController);

// Generate resume PDF for an interview report
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController);



module.exports = interviewRouter;