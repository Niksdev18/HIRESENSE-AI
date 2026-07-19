import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data in order of relations
  await prisma.refreshToken.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.savedJob.deleteMany({});
  await prisma.candidateProfile.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create HR Account
  const hr = await prisma.user.create({
    data: {
      name: 'Demo HR Manager',
      email: 'hr@hiresense.ai',
      password: hashedPassword,
      role: 'HR',
    },
  });
  console.log(`Created HR account: ${hr.email}`);

  // Create Candidate Account
  const candidate = await prisma.user.create({
    data: {
      name: 'Demo Candidate User',
      email: 'candidate@hiresense.ai',
      password: hashedPassword,
      role: 'Candidate',
    },
  });
  console.log(`Created Candidate account: ${candidate.email}`);

  // Create Candidate Profile with full mock details for profile completion and application eligibility
  await prisma.candidateProfile.create({
    data: {
      userId: candidate.id,
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      experienceYears: 3,
      education: JSON.stringify([{ degree: 'B.Sc. Computer Science', school: 'State University', year: '2022' }]),
      experience: JSON.stringify([{ title: 'Frontend Developer', company: 'WebTech Inc', duration: '2 years', description: 'Developed high-performance React dashboards.' }]),
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      bio: 'Full stack developer focused on responsive web systems and clean APIs.',
      githubUrl: 'https://github.com',
      linkedinUrl: 'https://linkedin.com',
      portfolioUrl: 'https://portfolio.com',
      resumeUrl: 'https://res.cloudinary.com/demo/image/upload/v1570979139/sample.pdf',
      resumeText: 'Demo Candidate User. Experience: Frontend Developer at WebTech Inc (2 years). Skills: React, TypeScript, Node.js, PostgreSQL. Education: B.Sc. Computer Science.',
    },
  });
  console.log(`Created Candidate Profile for: ${candidate.email}`);

  // Create Sample Job 1
  const job1 = await prisma.job.create({
    data: {
      title: 'Full Stack Engineer',
      company: 'HireSense Systems',
      description: 'We are looking for a skilled Full Stack Engineer to join our core product team. You will work with React, Node.js, and PostgreSQL to build cutting edge AI tools.',
      requiredSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      experience: '2-4 years',
      salary: '$80,000 - $110,000',
      location: 'Remote (US/Canada)',
      createdById: hr.id,
    },
  });
  console.log(`Created Sample Job 1: "${job1.title}"`);

  // Create Sample Job 2
  const job2 = await prisma.job.create({
    data: {
      title: 'Frontend React Developer',
      company: 'PixelPerfect Design',
      description: 'Join our team to construct fluid user interfaces. Expert React, CSS layout skills, and design tool integrations are required.',
      requiredSkills: ['React', 'Tailwind CSS', 'Figma', 'JavaScript'],
      experience: '3+ years',
      salary: '$90,000 - $120,000',
      location: 'New York, NY (Hybrid)',
      createdById: hr.id,
    },
  });
  console.log(`Created Sample Job 2: "${job2.title}"`);

  // Create pre-seeded Application for testing the visual timeline
  const app = await prisma.application.create({
    data: {
      jobId: job1.id,
      candidateId: candidate.id,
      status: 'Shortlisted', // Stepper state: Applied -> Shortlisted -> Interview -> Selected
    },
  });
  console.log(`Created pre-seeded Application for ${candidate.email} on ${job1.title} with status ${app.status}`);

  // Create pre-seeded SavedJob
  await prisma.savedJob.create({
    data: {
      jobId: job2.id,
      candidateId: candidate.id,
    },
  });
  console.log(`Created saved job relation for ${candidate.email} on ${job2.title}`);

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
