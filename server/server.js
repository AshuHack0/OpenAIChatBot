import express from "express";
import * as dotenv from "dotenv";
import cors from "cors"; 
import fs from 'fs'; 
import mysql from 'mysql2';
import { Configuration, OpenAIApi } from "openai";
dotenv.config();
const port = 8080;
 

// Create a connection pool
const pool = mysql.createPool({
    host: 'srv1020.hstgr.io',
    user: 'u266318027_root',
    password: 'Roghorpade2023!',
    database: 'u266318027_myfuse',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Helper function to execute MySQL queries
async function executeQuery(query) {
    const promisePool = pool.promise();
    try {
        const [results] = await promisePool.query(query);
        return results;
    } catch (error) {
        throw error;
    }
}


// Load job opening data from MySQL
async function loadJobOpeningsFromMySQL() {
    const query = 'SELECT * FROM job_post';
    try {
        const jobOpeningsData = await executeQuery(query);
        return jobOpeningsData;
    } catch (error) {
        console.error('Error loading job openings from MySQL: ' + error);
        throw error;
    }
}

 

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    res.status(200).send({
        message: 'Hello friends! The API server is up and running. This API was built by Ashutosh.',
    })
});

 

app.post('/', async (req, res) => {
    try {
        const jobOpeningsData = await loadJobOpeningsFromMySQL();
        // console.log('Job Openings Data:', jobOpeningsData);
        
        // Use the job opening data in the OpenAI prompt
        const prompt = req.body.prompt;
        // const jobOpeningsInfo = jobOpeningsData.map(job => `job title is  ${job.jobtitle} at company   ${job.companyName} on job industry ${job.industry} for job stream ${job.stream} and qulification is ${job.qualification} and this is for ${job.job_nature}`).join(', ');
        const jobOpeningsInfo = JSON.stringify(jobOpeningsData.map(job => ({
            Title: job.jobtitle,
            companyName: job.companyName,
            Industry: job.industry,
            Stream: job.stream,
            qualification: job.qualification,
            Nature: job.job_nature,
            location: job.location,
            // experience :job.experience,
            // Salary : job.minimumsalary,
            // CGPA_Required : job.maximumsalary,
            // link: job.link,
            // Responsibilities : job.responsibilities
        })));
        
        const placementPrompt = `${prompt} for MyFuse Job Placement Portal. You can find the latest job opening information in ${jobOpeningsInfo}  this data and  intially only show the company name and job title if user asked to specific job role or job company then show the job description `;
         // Get response from OpenAI API
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `${placementPrompt}`,
            temperature: 0.8,
            max_tokens: 3000,
            top_p: 1,
            frequency_penalty: 0.5,
            presence_penalty: 0,
        });

        res.status(200).send({
            bot: response.data.choices[0].text ,
           
        });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
})

app.listen(port,
    () => console.log(`Server is running on http://localhost:${port}`)
);