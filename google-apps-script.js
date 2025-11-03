/**
 * learnif. Newsletter Automation
 * Google Apps Script for automated newsletter sending
 * 
 * Features:
 * - Sends emails every hour starting from 11:11 AM
 * - Sends to batches of 45 subscribers
 * - Clears "sent" status at 11:59 PM daily
 */

// Configuration
const CONFIG = {
  API_URL: 'https://learnif.16xstudios.space/api/newsletter', // Your API endpoint
  BATCH_SIZE: 45, // Number of emails per batch
  SPREADSHEET_ID: '1V7RKKDE-RiVH_9mTIgbOTpPf9JsgQI0iY2yzRWq5-lc', // Your Google Sheet ID
  LEARNCODE_COLUMN: 'D', // Column D for learncode
};

/**
 * Main function to trigger from time-based trigger
 */
function sendNewsletterBatch() {
  Logger.log('========================================');
  Logger.log('[NEWSLETTER] Starting batch send process');
  Logger.log(`[NEWSLETTER] Time: ${new Date()}`);
  Logger.log('========================================');

  try {
    // Call the API
    const response = UrlFetchApp.fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({
        batchSize: CONFIG.BATCH_SIZE
      }),
      muteHttpExceptions: true // Don't throw on non-2xx responses
    });

    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log(`[NEWSLETTER] API Response Code: ${statusCode}`);
    Logger.log(`[NEWSLETTER] API Response: ${responseText}`);

    if (statusCode === 200) {
      const result = JSON.parse(responseText);
      Logger.log(`[NEWSLETTER] ✓ Success: ${result.message || 'Emails sent successfully'}`);
      Logger.log(`[NEWSLETTER] Sent: ${result.sent || 0}, Failed: ${result.failed || 0}`);
    } else {
      Logger.log(`[NEWSLETTER] ✗ Error: API returned status ${statusCode}`);
      Logger.log(`[NEWSLETTER] Response: ${responseText}`);
    }

  } catch (error) {
    Logger.log(`[NEWSLETTER] ✗ Fatal error: ${error.toString()}`);
    Logger.log(`[NEWSLETTER] Stack trace: ${error.stack}`);
  }

  Logger.log('========================================');
  Logger.log('[NEWSLETTER] Process completed');
  Logger.log('========================================\n');
}

/**
 * Clear all "sent" values in the learncode column
 * Should be triggered at 11:59 PM daily
 */
function clearLearncodeColumn() {
  Logger.log('========================================');
  Logger.log('[CLEAR] Starting clear process');
  Logger.log(`[CLEAR] Time: ${new Date()}`);
  Logger.log('========================================');

  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();

    if (!sheet) {
      Logger.log('[CLEAR] ✗ No active sheet found');
      return;
    }

    // Get the range for column D (learncode)
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      Logger.log('[CLEAR] No data rows to clear');
      return;
    }

    // Get all values in column D
    const range = sheet.getRange(2, 4, lastRow - 1, 1); // Start from row 2, column D
    const values = range.getValues();

    let clearedCount = 0;
    const newValues = [];

    // Clear "sent" values
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === 'sent') {
        newValues.push(['']); // Empty string instead of sent
        clearedCount++;
      } else {
        newValues.push([values[i][0]]); // Keep other values as is
      }
    }

    // Update the sheet
    if (newValues.length > 0) {
      range.setValues(newValues);
      Logger.log(`[CLEAR] ✓ Cleared ${clearedCount} "sent" values`);
    } else {
      Logger.log('[CLEAR] No "sent" values to clear');
    }

  } catch (error) {
    Logger.log(`[CLEAR] ✗ Fatal error: ${error.toString()}`);
    Logger.log(`[CLEAR] Stack trace: ${error.stack}`);
  }

  Logger.log('========================================');
  Logger.log('[CLEAR] Process completed');
  Logger.log('========================================\n');
}

/**
 * Setup all time-based triggers
 * Run this once to set up the automation
 */
function setupTriggers() {
  Logger.log('========================================');
  Logger.log('[SETUP] Setting up triggers');
  Logger.log('========================================');

  try {
    // Delete existing triggers first
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'sendNewsletterBatch' || 
          trigger.getHandlerFunction() === 'clearLearncodeColumn') {
        ScriptApp.deleteTrigger(trigger);
        Logger.log(`[SETUP] Deleted existing trigger: ${trigger.getHandlerFunction()}`);
      }
    });

    // Create hourly trigger starting at 11:11 AM
    // We'll create triggers for each hour: 11:11, 12:12, 13:13, etc.
    const hours = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]; // 11 AM to 10 PM
    
    hours.forEach((hour, index) => {
      const minute = 11; // All at :11 minutes
      
      const trigger = ScriptApp.newTrigger('sendNewsletterBatch')
        .timeBased()
        .everyDays(1)
        .atHour(hour)
        .nearMinute(minute)
        .create();
      
      Logger.log(`[SETUP] ✓ Created trigger for ${hour}:${String(minute).padStart(2, '0')} (index: ${index})`);
    });

    // Create trigger to clear learncode at 11:59 PM daily
    const clearTrigger = ScriptApp.newTrigger('clearLearncodeColumn')
      .timeBased()
      .everyDays(1)
      .atHour(23)
      .nearMinute(59)
      .create();

    Logger.log('[SETUP] ✓ Created trigger to clear learncode at 23:59');

    Logger.log('========================================');
    Logger.log('[SETUP] All triggers set up successfully!');
    Logger.log('========================================');
    
    // Show summary
    Logger.log('\n📧 Newsletter will be sent at:');
    hours.forEach(hour => {
      Logger.log(`   - ${hour}:11`);
    });
    Logger.log('\n🗑️ learncode column will be cleared at:');
    Logger.log('   - 23:59 (11:59 PM)');
    
  } catch (error) {
    Logger.log(`[SETUP] ✗ Fatal error: ${error.toString()}`);
    Logger.log(`[SETUP] Stack trace: ${error.stack}`);
  }
}

/**
 * Manual test function
 * Use this to test the newsletter sending manually
 */
function manualTest() {
  Logger.log('========================================');
  Logger.log('[MANUAL TEST] Running manual test');
  Logger.log('========================================');
  
  sendNewsletterBatch();
}

/**
 * Test clear function manually
 */
function manualTestClear() {
  Logger.log('========================================');
  Logger.log('[MANUAL TEST] Running clear test');
  Logger.log('========================================');
  
  clearLearncodeColumn();
}

/**
 * List all current triggers
 */
function listTriggers() {
  Logger.log('========================================');
  Logger.log('[TRIGGERS] Current triggers in project');
  Logger.log('========================================');
  
  const triggers = ScriptApp.getProjectTriggers();
  
  if (triggers.length === 0) {
    Logger.log('No triggers found.');
  } else {
    triggers.forEach((trigger, index) => {
      Logger.log(`\nTrigger ${index + 1}:`);
      Logger.log(`  Function: ${trigger.getHandlerFunction()}`);
      
      if (trigger.getTriggerSourceId()) {
        const source = trigger.getTriggerSource();
        Logger.log(`  Source: ${source}`);
      }
    });
  }
  
  Logger.log('========================================');
}

/**
 * Delete all triggers
 * Use this if you want to stop the automation
 */
function deleteAllTriggers() {
  Logger.log('========================================');
  Logger.log('[DELETE] Deleting all triggers');
  Logger.log('========================================');
  
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
    deletedCount++;
    Logger.log(`Deleted trigger: ${trigger.getHandlerFunction()}`);
  });
  
  Logger.log(`\n✓ Deleted ${deletedCount} trigger(s)`);
  Logger.log('========================================');
}

