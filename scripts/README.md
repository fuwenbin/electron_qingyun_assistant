# Development Scripts

This directory contains development and testing utility scripts for the video editor helper application.

## Clear Video Publish Tasks (Standalone)

### Overview
Script to clear all data from the `video_publish_tasks` table for development and testing purposes. This version is standalone and doesn't depend on the project's build.

### Usage

```bash
npm run clear:video-tasks
```
or
```bash
node scripts/clear-video-tasks.js
```

### Features

- ✅ **No build dependencies** - Works without building the main process
- ✅ **Online sql.js** - Automatically loads sql.js from CDN
- ✅ **Simple and reliable** - Minimal dependencies, direct database operations
- ✅ **Detailed logging** - Shows record count before and after deletion
- ✅ **Error handling** - Clear error messages and troubleshooting tips
- ✅ **Development optimized** - Designed specifically for development workflow

### Example Output

```
🧽 Video Publish Tasks Cleanup
=============================

🚀 Clearing video publish tasks...
📡 Database connected successfully
📊 Found 15 records in video_publish_tasks table
🗑️  Deleting all records...
💾 Database changes saved

✅ SUCCESS!
📊 Records deleted: 15
📊 Final record count: 0
🎉 Cleanup completed!
```

### Error Handling

Common issues and solutions:

1. **Module not found error:**
   ```
   Cannot find module 'sql.js'
   ```
   **Solution:** Install sql.js: `npm install sql.js`

2. **Database connection error:**
   - Ensure the application has been run at least once
   - Check if database file exists in project root

3. **Permission errors:**
   - Ensure application is not running when clearing data
   - Check file permissions on database file

## Clear Video Publish Tasks

### Overview
Script to clear all data from the `video_publish_tasks` table for development and testing purposes.

### Usage

```bash
npm run clear-tasks
```
or
```bash
node scripts/clear-tasks-simple.js
```

### Prerequisites

Before running the script, you need to build the main process:

```bash
npm run build:main
```

### Features

- ✅ **Uses application's database service** - Leverages existing database infrastructure
- ✅ **Simple and reliable** - Minimal dependencies, direct database operations
- ✅ **Detailed logging** - Shows record count before and after deletion
- ✅ **Error handling** - Clear error messages and troubleshooting tips
- ✅ **Development optimized** - Designed specifically for development workflow

### Development Workflow

Recommended workflow for testing:

1. **Build the main process:** `npm run build:main`
2. **Create test data** by using the application
3. **Clear data** with `npm run clear-tasks` 
4. **Verify** data is cleared in application
5. **Repeat** as needed during development

### Example Output

```
🧽 Video Publish Tasks Cleanup
=============================

🚀 Clearing video publish tasks...
📡 Database connected successfully
📊 Found 15 records in video_publish_tasks table
🗑️  Deleting all records...
💾 Database changes saved

✅ SUCCESS!
📊 Records deleted: 15
📊 Final record count: 0
🎉 Cleanup completed!

✨ Script completed successfully
```

### Error Handling

Common issues and solutions:

1. **Module not found error:**
   ```
   Cannot find module '../dist-electron/services/database-service'
   ```
   **Solution:** Run `npm run build:main` first to compile the services

2. **Database connection error:**
   - Ensure the application has been run at least once
   - Check if database file exists in project root

3. **Permission errors:**
   - Ensure application is not running when clearing data
   - Check file permissions on database file

### Development Workflow

Recommended workflow for testing:

1. **Create test data** by using the application
2. **Clear data** with `npm run clear-tasks` 
3. **Verify** data is cleared in application
4. **Repeat** as needed during development

### Security Note

⚠️ **WARNING:** These scripts permanently delete data! Only use in development environments.

- Do not run in production
- Always backup important data first
- Verify you're working with the correct database

---

### Security Note

⚠️ **WARNING:** These scripts permanently delete data! Only use in development environments.

- Do not run in production
- Always backup important data first
- Verify you're working with the correct database

---

## Adding New Scripts

When adding new development scripts:

1. Place them in the `scripts/` directory
2. Add executable permissions: `chmod +x scripts/your-script.js`
3. Add npm script command to `package.json`
4. Update this README with usage instructions
5. Include proper error handling and logging

## Script Template

```javascript
#!/usr/bin/env node

/**
 * Your Script Description
 * 
 * Usage: npm run your-command
 */

async function yourFunction() {
  try {
    console.log('🚀 Starting...');
    // Your code here
    console.log('✅ Success!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  yourFunction();
}
```