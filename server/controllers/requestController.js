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

export const deleteResource = async (req, res) => {
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

