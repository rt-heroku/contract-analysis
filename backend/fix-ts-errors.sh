#!/bin/bash

# Fix unused variables by prefixing with underscore
echo "Fixing unused variables..."

# Remove unused imports
perl -i -pe 's/^import FormData from '\''form-data'\'';$/\/\/ import FormData from '\''form-data'\''; \/\/ Unused/' backend/src/services/muleSoft.service.ts
perl -i -pe 's/^import \{ UPLOAD_TYPES \} from '\''\.\.\/utils\/constants'\'';$/\/\/ import \{ UPLOAD_TYPES \} from '\''\.\.\/utils\/constants'\''; \/\/ Unused/' backend/src/services/file.service.ts  
perl -i -pe 's/, NotificationData//' backend/src/services/logging.service.ts

# Fix unused variables
perl -i -pe 's/let error: any = null;/\/\/ let error: any = null; \/\/ Unused/' backend/src/services/muleSoft.service.ts

echo "Done!"


