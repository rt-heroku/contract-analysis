# Seed Error Handling Actions

The new error handling actions (Try Catch Finally, Raise Error, On Error, Retry, Call Process) need to be seeded into the database.

## Run this command after deployment:

```bash
heroku run "cd backend && node dist/utils/seedActions.js" --app contract-dev
```

This will add all the new system actions to the database, making them visible in the Process Designer action palette under the "Error Handling" and "Flow Control" categories.

## What gets added:
- **Try Catch Finally** - Error handling with try/catch/finally blocks
- **Raise Error** - Throw custom errors
- **On Error** - Global error handler
- **Retry** - Exponential backoff retry
- **Call Process** - Execute sub-processes

After running this script, refresh the Process Designer page to see the new actions in the toolbar.

