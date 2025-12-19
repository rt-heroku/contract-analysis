# UUID Fix - Heroku Deployment Checklist

**Date:** December 19, 2025  
**Issue:** Upload 400 Bad Request - ES Module Error  
**Status:** ✅ Ready to Deploy

---

## ✅ Pre-Deployment Checklist

- [x] UUID package downgraded to v9.0.1
- [x] @types/uuid installed with matching version (v9.0.0)
- [x] uuid.ts utility updated with standard imports
- [x] Local build successful
- [x] TypeScript compilation verified
- [x] All changes committed to git

---

## 🚀 Deployment Steps

### Step 1: Verify Current Status

```bash
cd /Users/rodrigo.torres/mulesoft-work/projects/contract

# Check git status
git status

# Should show: "Your branch is ahead of 'origin/main' by X commits"
```

### Step 2: Push to Origin (if needed)

```bash
# Push to origin remote
git push origin main
```

### Step 3: Deploy to Heroku

```bash
# Deploy to Heroku
git push heroku main
```

**Expected Output:**
```
remote: -----> Building on the Heroku-22 stack
remote: -----> Using buildpacks:
remote:        1. heroku/nodejs
remote: -----> Node.js app detected
remote: -----> Installing dependencies
remote:        Installing node modules
remote: -----> Build
remote:        Running build
remote:        > document-processing-backend@1.0.0 build
remote:        > npx --package=typescript -- tsc
remote: -----> Build succeeded!
```

### Step 4: Monitor Deployment

```bash
# Watch Heroku logs in real-time
heroku logs --tail --app contract-dev-97eee4f65074
```

**Look for:**
- ✅ `Build succeeded`
- ✅ `State changed from starting to up`
- ✅ No TypeScript errors
- ✅ Server started successfully

### Step 5: Verify Upload Functionality

1. **Open the application:**
   ```
   https://contract-dev-97eee4f65074.herokuapp.com
   ```

2. **Navigate to Processing:**
   - Go to `/processing` route
   - You should see the file upload interface

3. **Test Upload:**
   - Select a file (contract or data)
   - Choose upload type
   - Click upload button
   - **Expected:** File uploads successfully without 400 error

4. **Verify in Logs:**
   ```bash
   heroku logs --tail --app contract-dev-97eee4f65074
   ```
   
   **Look for:**
   - ✅ `🆕 Generated new jobId:` or `♻️ Reusing existing jobId:`
   - ✅ `Uploaded [contract|data] file: [filename]`
   - ✅ No error messages
   - ✅ Status 201 response

---

## 📋 Post-Deployment Verification

### Check 1: API Health
```bash
# Test the uploads endpoint
curl -X GET https://contract-dev-97eee4f65074.herokuapp.com/api/uploads \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** 200 OK with user uploads list

### Check 2: Database
- Log into Heroku Postgres
- Verify `uploads` table is accessible
- Check that new uploads are being created

### Check 3: Application Logs
```bash
# Check recent logs
heroku logs --tail --app contract-dev-97eee4f65074

# Filter for upload-related logs
heroku logs --tail --app contract-dev-97eee4f65074 | grep -i upload
```

**Should see:**
- ✅ No "ES Module" errors
- ✅ No "Could not find declaration file" errors
- ✅ Successful upload activity logs

---

## 🔧 Troubleshooting

### Issue: Build Still Failing

**Check package.json versions:**
```bash
# SSH into Heroku
heroku run bash --app contract-dev-97eee4f65074

# Check installed versions
npm list uuid
npm list @types/uuid
```

**Expected:**
- `uuid@9.0.1`
- `@types/uuid@9.0.0`

**If versions don't match:**
```bash
# Force reinstall
heroku run "npm install uuid@9.0.1 @types/uuid@9.0.0" --app contract-dev-97eee4f65074
```

### Issue: Still Getting 400 Error

**Check if old build is cached:**
```bash
# Clear build cache
heroku repo:purge_cache --app contract-dev-97eee4f65074

# Redeploy
git commit --allow-empty -m "Trigger rebuild"
git push heroku main
```

### Issue: TypeScript Errors in Build

**Check TypeScript config:**
```bash
heroku run cat backend/tsconfig.json --app contract-dev-97eee4f65074
```

**Verify:**
- `"module": "commonjs"`
- `"esModuleInterop": true`

### Issue: devDependencies Not Installed

**Check Heroku config:**
```bash
heroku config:get NPM_CONFIG_PRODUCTION --app contract-dev-97eee4f65074
```

**If it returns "true":**
```bash
# Allow devDependencies during build
heroku config:set NPM_CONFIG_PRODUCTION=false --app contract-dev-97eee4f65074
```

**Note:** Heroku's Node.js buildpack automatically installs devDependencies during build, then prunes them after. This is normal and expected.

---

## 📊 Success Criteria

All of the following must be true:

- ✅ Heroku build completes without errors
- ✅ Application starts successfully
- ✅ File upload returns 201 status
- ✅ No ES Module errors in logs
- ✅ Uploads appear in database
- ✅ Activity logs record uploads
- ✅ No 400 Bad Request errors

---

## 🔄 Rollback Plan

If deployment fails and you need to rollback:

```bash
# List recent releases
heroku releases --app contract-dev-97eee4f65074

# Rollback to previous release
heroku rollback v[PREVIOUS_VERSION] --app contract-dev-97eee4f65074

# Example:
heroku rollback v123 --app contract-dev-97eee4f65074
```

**Then investigate locally:**
```bash
# Pull latest from Heroku
git fetch heroku

# Check differences
git diff main heroku/main
```

---

## 📝 Changes Summary

### Commits Deployed

1. **`d633cd5`** - Fix ES Module error by downgrading uuid
2. **`fd709b8`** - Add comprehensive documentation
3. **`cc00da5`** - Correct @types/uuid version to v9.0.0
4. **`73577a0`** - Update documentation with version fix

### Files Changed

- `backend/package.json` - Updated uuid and @types/uuid versions
- `backend/package-lock.json` - Lockfile updated
- `backend/src/utils/uuid.ts` - Simplified import syntax
- `docs/upload-fix-251219/UUID_ES_MODULE_FIX.md` - Documentation
- `docs/upload-fix-251219/DEPLOYMENT_CHECKLIST.md` - This file

---

## 🎯 Next Steps After Successful Deployment

1. **Test all upload scenarios:**
   - Contract file upload (PDF, PNG, JPG, TIFF)
   - Data file upload (Excel, CSV)
   - Multiple files with same jobId
   - New jobId generation

2. **Monitor for 24 hours:**
   - Check error rates in Heroku metrics
   - Review application logs for issues
   - Verify user feedback

3. **Update stakeholders:**
   - Notify team that upload issue is resolved
   - Document lessons learned
   - Update runbooks if needed

4. **Clean up:**
   - No cleanup needed - changes are permanent
   - Keep documentation for future reference

---

## 📞 Support

If you encounter issues:

1. **Check Logs:**
   ```bash
   heroku logs --tail --app contract-dev-97eee4f65074
   ```

2. **Check App Status:**
   ```bash
   heroku ps --app contract-dev-97eee4f65074
   ```

3. **Restart if Needed:**
   ```bash
   heroku restart --app contract-dev-97eee4f65074
   ```

4. **Review Documentation:**
   - `/docs/upload-fix-251219/UUID_ES_MODULE_FIX.md`
   - This deployment checklist

---

**Last Updated:** December 19, 2025  
**Ready for Deployment:** ✅ YES

---

*Deploy with confidence! All tests passed and documentation is complete.*

