**DEPLOYED LINK:**
fetchit-production.up.railway.app

To run the project, open the terminal in the project directory and initialize Node.js by running:

## npm init

If the required dependencies are not yet installed, install them using:

## npm install express body-parser ejs mysql2
## npm install --save-dev nodemon

Before starting the server, make sure to set up the database. Open MySQL and run the provided SQL query file to create the necessary tables and populate them with data.

Once the database has been set up, start the server by running:

## npm start

After the server starts, open a browser and go to:

http://localhost:3000

If the application does not run properly, ensure that all dependencies are installed, the MySQL server is running, and the database connection settings (host, user, password, and database name) are correctly configured in the project files. Also make sure that port 3000 is not being used by another application.