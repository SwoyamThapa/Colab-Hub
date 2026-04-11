import User from '../models/User.js';
import ProjectRequest from '../models/ProjectRequest.js';

export const getPublicProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const completedProjects = await ProjectRequest.find({
      status: 'completed',
      $or: [{ author: id }, { helper: id }],
    })
      .populate('author', 'name')
      .populate('helper', 'name')
      .sort({ updatedAt: -1 });

    return res.json({ user, completedProjects });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

function parseSkillsInput(skills) {
  if (Array.isArray(skills)) {
    return skills.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof skills === 'string') {
    return skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export const updateProfile = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { bio, skills, githubLink, linkedIn } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (bio !== undefined) {
      user.bio = typeof bio === 'string' ? bio : user.bio ?? '';
    }
    if (skills !== undefined) {
      user.skills = parseSkillsInput(skills);
    }
    if (githubLink !== undefined) {
      user.githubLink =
        typeof githubLink === 'string' ? githubLink.trim() : user.githubLink ?? '';
    }
    if (linkedIn !== undefined) {
      user.linkedIn =
        typeof linkedIn === 'string' ? linkedIn.trim() : user.linkedIn ?? '';
    }

    await user.save();

    const updated = await User.findById(userId).select('-password');
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
