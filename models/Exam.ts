import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['mcq', 'descriptive', 'true_false', 'fill_blank'],
        required: true,
    },
    questionText: { type: String, required: true },
    options: [{ type: String }], // For MCQ/Checkboxes
    correctAnswer: { type: mongoose.Schema.Types.Mixed }, // String or Array or Boolean
    marks: { type: Number, default: 1 },
});

const ExamSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an exam title'],
    },
    description: { type: String },
    instructions: { type: String },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    duration: { type: Number, required: true }, // in minutes
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    questions: [QuestionSchema],
    proctoring: { type: Boolean, default: true },
    allowedEmails: { type: [String], default: [] }, // Empty = Open to all
    accessCode: { type: String }, // Optional code to enter exam
}, { timestamps: true });

export default mongoose.models.Exam || mongoose.model('Exam', ExamSchema);
