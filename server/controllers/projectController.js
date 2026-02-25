import Project from '../models/Project.js';
import User from '../models/User.js';

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate('owner', 'name email');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
