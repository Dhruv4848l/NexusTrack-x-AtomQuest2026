/**
 * Upload all walkthrough screenshots to Cloudinary and print the URLs.
 * Run: node scratch/uploadScreenshots.js
 */
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const SCREENSHOTS_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME,
  '.gemini', 'antigravity', 'brain',
  'c98366fd-d525-4cef-90f5-8b6835e2194a'
);

// Only the screenshots we use in the walkthrough (in order)
const FILES = [
  'login_page_clean_1779135024676.png',
  'login_page_filled_1779135085905.png',
  'dashboard_page_1779135110393.png',
  'empty_add_user_form_1779135197009.png',
  'filled_add_user_form_1779135385401.png',
  'new_user_in_list_1779135447346.png',
  'neha_manager_assigned_1779135558761.png',
  'first_login_empty_1779135711247.png',
  'first_login_filled_1779135767700.png',
  'employee_dashboard_1779135790880.png',
  'empty_goal_sheet_1779135857277.png',
  'goals_completed_1779136406925.png',
  'draft_saved_1779136431480.png',
  'goals_submitted_1779136476854.png',
  'manager_dashboard_1779136919996.png',
  'goals_approved_state_1779136953724.png',
  'employee_dashboard_approved_goals_1779137056642.png',
  'first_checkin_saved_1779137166781.png',
  'updated_checkins_page_with_progress_1779137224520.png',
  'neha_profile_initial_1779137296306.png',
  'neha_profile_saved_1779137324461.png',
  'profile_upload_btn_1779137336274.png',
  'manager_reports_page_1779137496999.png',
  'manager_team_checkins_neha_progress_1779137573953.png',
  'manager_completion_status_1779137593934.png',
];

(async () => {
  const results = {};
  for (const file of FILES) {
    const filePath = path.join(SCREENSHOTS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`SKIP (not found): ${file}`);
      continue;
    }
    try {
      const baseName = file.replace(/(_\d+)?\.png$/, '');
      const res = await cloudinary.uploader.upload(filePath, {
        folder: 'atomquest_walkthrough',
        public_id: baseName,
        overwrite: true,
        resource_type: 'image',
      });
      results[file] = res.secure_url;
      console.log(`OK  ${file}  →  ${res.secure_url}`);
    } catch (err) {
      console.error(`FAIL ${file}: ${err.message}`);
    }
  }

  // Write mapping JSON
  const outPath = path.join(SCREENSHOTS_DIR, 'cloudinary_urls.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nURL mapping saved to: ${outPath}`);
  process.exit(0);
})();
