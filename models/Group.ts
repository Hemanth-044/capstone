import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['link', 'note', 'file'], default: 'link' },
    content: { type: String, required: true }, // URL or text content
    createdAt: { type: Date, default: Date.now },
});

const PostSchema = new mongoose.Schema({
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: String }], // Store emails for simplicity and allowing pre-signup adding
    resources: [ResourceSchema],
    posts: [PostSchema],
}, { timestamps: true });

export default mongoose.models.Group || mongoose.model('Group', GroupSchema);
