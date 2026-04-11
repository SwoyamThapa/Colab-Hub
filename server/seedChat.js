import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from './models/Message.js';
import ProjectRequest from './models/ProjectRequest.js';

dotenv.config();

const REQUEST_ID = '69bd4c6aba65fbbc65f2cb64';

async function seedMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const project = await ProjectRequest.findById(REQUEST_ID);

    if (!project) {
      console.error('Error: Project request not found for the given REQUEST_ID.');
      await mongoose.connection.close();
      process.exit(1);
    }

    if (!project.helper) {
      console.error('Error: Project has no helper; cannot seed a two-party chat.');
      await mongoose.connection.close();
      process.exit(1);
    }

    const leadId = project.author;
    const helperId = project.helper;

    const now = Date.now();
    const minute = 60 * 1000;
    const createdAts = [
      new Date(now - 15 * minute),
      new Date(now - 10 * minute),
      new Date(now - 5 * minute),
      new Date(now - 1 * minute),
    ];

    const docs = [
      {
        request: REQUEST_ID,
        sender: leadId,
        text: "Hey! I'm thinking we should add a real-time team chat to the workspace so we don't lose context in email threads.",
        createdAt: createdAts[0],
        updatedAt: createdAts[0],
      },
      {
        request: REQUEST_ID,
        sender: helperId,
        text: 'Agreed — Socket.io would pair well with our existing Express API. We can namespace rooms per project request.',
        createdAt: createdAts[1],
        updatedAt: createdAts[1],
      },
      {
        request: REQUEST_ID,
        sender: leadId,
        text: "Let's persist history in MongoDB and load it on join, then broadcast new messages to everyone in the room.",
        createdAt: createdAts[2],
        updatedAt: createdAts[2],
      },
      {
        request: REQUEST_ID,
        sender: helperId,
        text: "Sounds good. I'll wire up join_workspace and send_message on the server; you can handle the scrollable chat UI and bubbles.",
        createdAt: createdAts[3],
        updatedAt: createdAts[3],
      },
    ];

    await Message.insertMany(docs);

    console.log('Successfully seeded messages!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

seedMessages();
