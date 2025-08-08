import { PrismaClient, DraftType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'SecureAdmin123!';

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
    },
  });

  console.log('✅ Admin user created/updated:', admin.email);

  // 2. Create Default Draft Templates
  const defaultDrafts = [
    {
      type: DraftType.SHARE,
      subject: '🎯 New Quiz Alert: {{TITLE}}',
      content: `🎉 A new quiz is live!

📝 **Quiz Title:** {{TITLE}}
🔗 **Take the Quiz:** {{LINK}}
⏰ **Deadline:** {{DEADLINE}}

Don't miss out - participate now and win exciting prizes! 🏆

Good luck! 🍀`,
    },
    {
      type: DraftType.QUESTION,
      subject: '📊 Quiz Results: {{TITLE}} - Winner Announcement',
      content: `📊 **Quiz Results for: {{TITLE}}**

🎯 **Quiz Statistics:**
- Total Responses: {{TOTAL_RESPONSES}}
- Correct Answers: {{CORRECT_COUNT}}
- Wrong Answers: {{WRONG_COUNT}}

🏆 **Winner Selected:**
- Name: {{WINNER_NAME}}
- Phone: {{WINNER_PHONE}}

👥 **Participants with Correct Answers:**
{{CORRECT_NAMES}}

❌ **Participants with Wrong Answers:**
{{WRONG_NAMES}}

Congratulations to all participants! 🎉`,
    },
    {
      type: DraftType.MONTHLY,
      subject: '🏆 Monthly Winner - {{MONTH}} {{YEAR}}',
      content: `🎊 **Monthly Winner Announcement**

📅 **Month:** {{MONTH}} {{YEAR}}
🏆 **Monthly Champion:** {{WINNER_NAME}}
📞 **Contact:** {{WINNER_PHONE}}

🎯 **This Month's Summary:**
- Total Quiz Winners: {{TOTAL_WINNERS}}
- Random Selection Winner: {{WINNER_NAME}}

This participant has been randomly selected from all quiz winners this month!

Congratulations! 🎉🏆

---
Thank you to all participants for making this month exciting!`,
    },
  ];

  for (const draft of defaultDrafts) {
    const createdDraft = await prisma.draft.upsert({
      where: { type: draft.type },
      update: {
        subject: draft.subject,
        content: draft.content,
      },
      create: draft,
    });
    console.log(`✅ Draft template created/updated: ${createdDraft.type}`);
  }

  // 3. Optional: Create sample quiz for testing (only in development)
  if (process.env.NODE_ENV === 'development') {
    const sampleQuiz = await prisma.quiz.upsert({
      where: { slug: 'sample-quiz-1' },
      update: {},
      create: {
        slug: 'sample-quiz-1',
        title: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 'Paris',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });
    console.log('✅ Sample quiz created for development:', sampleQuiz.title);

    // Add sample responses for testing
    const sampleResponses = [
      { name: 'John Doe', phone: '1234567890', answer: 'Paris', isCorrect: true },
      { name: 'Jane Smith', phone: '9876543210', answer: 'London', isCorrect: false },
      { name: 'Bob Wilson', phone: '5555551234', answer: 'Paris', isCorrect: true },
    ];

    for (const response of sampleResponses) {
      await prisma.response.upsert({
        where: {
          unique_response_per_phone_per_quiz: {
            quizId: sampleQuiz.id,
            phone: response.phone,
          },
        },
        update: {},
        create: {
          ...response,
          quizId: sampleQuiz.id,
        },
      });
    }
    console.log('✅ Sample responses created');
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });