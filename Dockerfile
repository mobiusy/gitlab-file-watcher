# Use an official Node.js runtime as the base image
FROM node:18-alpine
 # Set the working directory inside the container
WORKDIR /app
 # Copy package.json and package-lock.json to the working directory
COPY package*.json ./
 # Install project dependencies
RUN npm install
 # Copy the rest of the project files to the working directory
COPY . .
 # Start the application
CMD ["npm", "start"]