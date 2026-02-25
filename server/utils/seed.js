import 'dotenv/config';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

const seed = async () => {
  await connectDB();

  await User.deleteMany({});
  await Project.deleteMany({});

  const user = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    skills: ['React', 'Node.js'],
  });

  await Project.create([
    {
      title: 'Colab Hub',
      description: 'A centralized project incubation platform for students to find collaborators and build projects together.',
      owner: user._id,
      rolesNeeded: ['Frontend', 'Backend', 'UI Design'],
      status: 'open',
    },
    {
      title: 'Study Buddy',
      description: 'An app to match students for study sessions and share notes.',
      owner: user._id,
      rolesNeeded: ['Mobile Dev', 'Backend'],
      status: 'open',
    },
  ]);

  console.log('Database Seeded!');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
