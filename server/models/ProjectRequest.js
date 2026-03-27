import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: true }
);

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const projectRequestSchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    helper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    availableCustomRoles: {
      type: [String],
      default: [],
    },
    authorProjectRole: {
      type: String,
      default: '',
      trim: true,
    },
    helperProjectRole: {
      type: String,
      default: '',
      trim: true,
    },
    helperControlRole: {
      type: String,
      enum: ['Collaborator', 'Co-Lead'],
      default: 'Collaborator',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed'],
      default: 'pending',
    },
    tasks: {
      type: [taskSchema],
      default: [],
    },
    resources: {
      type: [resourceSchema],
      default: [],
    },
    scratchpad: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('ProjectRequest', projectRequestSchema);

