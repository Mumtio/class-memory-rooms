# Demo Data Seeder

This script populates Foru.ms with demo school data for testing and development.

## What It Does

The seeder creates:
- ✅ Demo High School (with join key: DEMO24)
- ✅ 4 Subjects (Physics, Math, CS, Chemistry)
- ✅ 9 Courses across all subjects
- ✅ Multiple Chapters for each course
- ✅ Sample Contributions (takeaways, resources, examples)

## Prerequisites

1. Make sure `.env.local` file exists in the `frontend` directory
2. Set Foru.ms credentials in `.env.local`:
   ```
   FORUMMS_SEED_USERNAME=your_username
   FORUMMS_SEED_PASSWORD=your_password
   ```
3. Install dependencies: `npm install`

**Note:** The script will automatically register the user if they don't exist.

## How to Run

```bash
cd frontend
npm run seed
```

Or directly:

```bash
cd frontend
node scripts/seed-demo-data.js
```

## What Happens

The script will:
0. Login to Foru.ms (or register if user doesn't exist)
1. Create a demo school thread in Foru.ms
2. Add subjects as posts in the school thread
3. Add courses as posts linked to subjects
4. Create chapter threads for each course
5. Add sample contributions to the first few chapters

## Output

You'll see progress logs like:

```
🌱 Starting demo data seeding...

📚 Creating Demo School...
✅ School created: abc123

📖 Creating Subjects...
  ✅ Physics
  ✅ Mathematics
  ✅ Computer Science
  ✅ Chemistry

📝 Creating Courses...
  ✅ PHY-101: Mechanics I
  ...

📑 Creating Chapters...
  ✅ PHY-101 - Lec 01: Vectors & Scalars
  ...

💬 Adding Sample Contributions...
  ✅ Added contributions to chapter xyz789
  ...

🎉 Demo data seeding completed successfully!

📊 Summary:
  - School ID: abc123
  - Join Key: DEMO24
  - Subjects: 4
  - Courses: 9
  - Chapters: 14
  - Sample Contributions: 15

✨ You can now join the demo school with key: DEMO24
```

## After Seeding

1. Register a new user in your app
2. Join the demo school using key: **DEMO24**
3. Explore the pre-populated content
4. Test all features with real data

## Troubleshooting

### Error: FORUMMS_API_KEY environment variable is required
- Make sure `.env.local` exists in the `frontend` directory
- Check that `FORUMMS_API_KEY` is set correctly

### Error: API call failed: 401
- Your API key might be invalid
- Check the API key in `.env.local`

### Error: API call failed: 404
- The Foru.ms API URL might be incorrect
- Check `FORUMMS_API_URL` in `.env.local`

## Customizing the Data

Edit `seed-demo-data.js` to customize:
- School name and description
- Subjects and their colors
- Courses and teachers
- Chapters and their content
- Sample contributions

## Re-running the Seeder

⚠️ **Warning:** Running the seeder multiple times will create duplicate data in Foru.ms.

To start fresh:
1. Manually delete the demo school from Foru.ms (if possible)
2. Or use a different join key in the script

## Next Steps

After seeding:
1. All pages should now fetch real data from Foru.ms
2. Test the entire app flow
3. Verify all features work with real data
4. Deploy to production with confidence!
