APPLICATION SETUP GUIDE — ORCHARD MANAGER (MENADŻERSADU)

The application consists of two independent parts: the server (Backend)
and the client (Frontend). For the system to work correctly, both layers
must be run in parallel.


1. REQUIRED SOFTWARE

Before you start, make sure you have installed:

- Docker Desktop (for running the database in a container) or another tool compatible with the Docker CLI.
- JDK 21 (can be installed and configured directly through IntelliJ IDEA).
- Node.js (a version that includes the npm package manager).
- Apache Maven (optional, if you are not using the one built into your IDE).
- An IDE, for example:
   - IntelliJ IDEA (recommended for the server layer)
   - Visual Studio Code (recommended for the client layer)


2. SETUP GUIDE — SERVER LAYER (BACKEND)

- Open a terminal and go to the backend directory:
   cd ./backend

- Start the database containers (requires Docker Desktop running in the background).
   You can do this in two ways:
    a) From the terminal:
       docker-compose -f compose.yaml up -d
    b) From within IntelliJ IDEA:
       Open the compose.yaml file and click the "Run" icon (double arrow).

- Build the application and download the Maven dependencies:
   mvn clean package install

- Configuration in the IDE (e.g. IntelliJ IDEA):
   - Open the ./backend folder as a project.
   - In the project settings (Project Structure), make sure the selected SDK version is Java 21.
   - Refresh the Maven project so that all libraries are downloaded.

- Running the application:
   - Find the file: FruitFarmManagementApplication.java
   - Run it (Run).


3. SETUP GUIDE — CLIENT LAYER (FRONTEND)

- Open a new terminal (without closing the server terminal).

- Go to the frontend directory:
   cd ./frontend

- Install the required libraries (dependencies from the included package.json file):
   npm install

- Start the application's development server:
   npm run dev


4. ACCESSING THE APPLICATION

Once the steps above have been completed successfully, the application will be available
in your web browser at: http://localhost:5173/
