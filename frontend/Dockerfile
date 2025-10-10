FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server (for dev)
CMD ["npm", "run", "dev", "--", "--host"]

# For production, uncomment these instead:
# RUN npm run build
# CMD ["npm", "run", "preview", "--", "--host"]


