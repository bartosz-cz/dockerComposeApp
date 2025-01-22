FROM node:18

WORKDIR /app

# Copy only package.json and package-lock.json initially
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the application code
COPY . .

# Expose port
EXPOSE 5000

CMD ["npm", "start"]
