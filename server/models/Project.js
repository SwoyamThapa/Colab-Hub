import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rolesNeeded: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'archived'],
      default: 'open',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
