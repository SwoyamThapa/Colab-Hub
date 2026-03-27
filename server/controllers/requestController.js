import ProjectRequest from '../models/ProjectRequest.js';

function canAccessWorkspace(requestDoc, userId) {
  const authorId =
    requestDoc.author?._id?.toString() ?? requestDoc.author?.toString();
  const helperId = requestDoc.helper
    ? requestDoc.helper?._id?.toString() ?? requestDoc.helper?.toString()
    : null;
  const uid = String(userId);
  const isAuthor = authorId === uid;
  const isHelper = helperId != null && helperId === uid;
  return isAuthor || isHelper;
}

async function populateRequestForResponse(id) {
  return ProjectRequest.findById(id)
    .populate('author', 'name email')
    .populate('helper', 'name email')
    .populate('tasks.assignee', 'name email');
}

function isAuthor(requestDoc, userId) {
  return String(requestDoc.author) === String(userId);
}

function isCoLead(requestDoc, userId) {
  if (!requestDoc.helper) return false;
  return (
    String(requestDoc.helper) === String(userId) &&
    requestDoc.helperControlRole === 'Co-Lead'
  );
}

function canManageRoles(requestDoc, userId) {
  return isAuthor(requestDoc, userId) || isCoLead(requestDoc, userId);
}

export const createRequest = async (req, res) => {
  const { title, description, category } = req.body;
  const userId = req.user?.id;

  if (!title || !description || !category) {
    return res.status(400).json({ message: 'title, description, and category are required' });
  }

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const request = await ProjectRequest.create({
      title,
      description,
      category,
      author: userId,
    });

    return res.status(201).json(request);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const requests = await ProjectRequest.find()
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getRequestById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const request = await populateRequestForResponse(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (!canAccessWorkspace(request, userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(request);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const addTask = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const trimmed = typeof title === 'string' ? title.trim() : '';
  if (!trimmed) {
    return res.status(400).json({ message: 'title is required' });
  }

  try {
    const request = await ProjectRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (!canAccessWorkspace(request, userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    request.tasks.push({ title: trimmed });
    await request.save();

    const populated = await populateRequestForResponse(id);
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleTask = async (req, res) => {
  const { id, taskId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const request = await ProjectRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (!canAccessWorkspace(request, userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const task = request.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.isCompleted = !task.isCompleted;
    await request.save();

    const populated = await populateRequestForResponse(id);
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const assignTask = async (req, res) => {
  const { id, taskId } = req.params;
  const userId = req.user?.id;
  const { assigneeId } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const nextAssignee =
    typeof assigneeId === 'string' && assigneeId.trim()
      ? assigneeId.trim()
      : null;

  try {
    const request = await ProjectRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Any accepted team member (author or helper) can assign tasks.
    if (!canAccessWorkspace(request, userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const task = request.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (nextAssignee) {
      const authorId = request.author?.toString();
      const helperId = request.helper ? request.helper?.toString() : null;
      if (String(nextAssignee) !== String(authorId) && String(nextAssignee) !== String(helperId)) {
        return res.status(400).json({ message: 'Assignee must be a team member' });
      }
      task.assignee = nextAssignee;
    } else {
      task.assignee = undefined;
    }

    await request.save();

    const populated = await populateRequestForResponse(id);
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const addResource = async (req, res) => {
  const { id } = req.params;
  const { title, url } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const titleTrim =
    typeof title === 'string' ? title.trim() : '';
  const urlTrim = typeof url === 'string' ? url.trim() : '';

  if (!titleTrim || !urlTrim) {
    return res.status(400).json({ message: 'title and url are required' });
  }

  try {
    const request = await ProjectRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (!canAccessWorkspace(request, userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    request.resources.push({ title: titleTrim, url: urlTrim });
    await request.save();

    const populated = await populateRequestForResponse(id);
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeResource = async (req, res) => {
  const { id, resourceId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const request = await ProjectRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (!canAccessWorkspace(request, userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const resource = request.resources.id(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    request.resources.pull(resourceId);
    await request.save();

    const populated = await populateRequestForResponse(id);
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const saveScratchpad = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { text } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const nextText = typeof text === 'string' ? text : '';

  try {
    const request = await ProjectRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Any accepted team member (author or helper) can save scratchpad notes.
    if (!canAccessWorkspace(request, userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    request.scratchpad = nextText;
    await request.save();

    const populated = await populateRequestForResponse(id);
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const addCustomRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const roleTrim = typeof role === 'string' ? role.trim() : '';
  if (!roleTrim) {
    return res.status(400).json({ message: 'role is required' });
  }

  try {
    const request = await ProjectRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (!canManageRoles(request, userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const existing = Array.isArray(request.availableCustomRoles)
      ? request.availableCustomRoles
      : [];
    const already = existing.some(
      (r) => String(r).toLowerCase() === roleTrim.toLowerCase()
    );
    if (!already) {
      request.availableCustomRoles.push(roleTrim);
      await request.save();
    }

    const populated = await populateRequestForResponse(id);
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProjectRole = async (req, res) => {
  const { id } = req.params;
  const { targetUser, role } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (targetUser !== 'author' && targetUser !== 'helper') {
    return res.status(400).json({ message: 'Invalid targetUser' });
  }

  const roleTrim = typeof role === 'string' ? role.trim() : '';

  try {
    const request = await ProjectRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (!canManageRoles(request, userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowed = Array.isArray(request.availableCustomRoles)
      ? request.availableCustomRoles
      : [];
    if (roleTrim !== '' && !allowed.includes(roleTrim)) {
      return res.status(400).json({ message: 'Role must be one of the available custom roles' });
    }

    if (targetUser === 'author') {
      request.authorProjectRole = roleTrim;
    } else {
      if (!request.helper) {
        return res.status(400).json({ message: 'No collaborator to assign a role to' });
      }
      request.helperProjectRole = roleTrim;
    }

    await request.save();

    const populated = await populateRequestForResponse(id);
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateControlRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (role !== 'Collaborator' && role !== 'Co-Lead') {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const request = await ProjectRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (!isAuthor(request, userId)) {
      return res.status(403).json({ message: 'Only the project lead can change control roles' });
    }

    if (!request.helper) {
      return res.status(400).json({ message: 'No collaborator to promote' });
    }

    request.helperControlRole = role;
    await request.save();

    const populated = await populateRequestForResponse(id);
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const acceptRequest = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const request = await ProjectRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status === 'accepted' || request.status === 'completed') {
      return res
        .status(400)
        .json({ message: `Cannot accept a ${request.status} request` });
    }

    request.status = 'accepted';
    request.helper = userId;

    await request.save();

    return res.json(request);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteRequest = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const request = await ProjectRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only the author (Project Lead) can delete their request.
    if (String(request.author) !== String(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await ProjectRequest.findByIdAndDelete(id);
    return res.json({ message: 'Request removed' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateRequestStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { status } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // For now we only support marking a request as completed.
  if (status !== 'completed') {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const request = await ProjectRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only the author (Project Lead) can update the status.
    if (String(request.author) !== String(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    request.status = 'completed';
    await request.save();

    const populated = await populateRequestForResponse(id);
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

