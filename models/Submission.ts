import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    answers: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        required: true,
    },
    score: { type: Number, default: 0 },
    flags: [{
        type: { type: String }, // e.g., 'TAB_SWITCH', etc.
        message: String,
        timestamp: { type: Date, default: Date.now }
    }],
    captures: [{
        image: String, // Base64 string
        reason: String,
        timestamp: { type: Date, default: Date.now },
    }],
    submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
