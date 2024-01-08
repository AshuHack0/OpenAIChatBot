import express from "express";
import * as dotenv from "dotenv";
import cors from "cors"; 
import fs from 'fs'; 
import mysql from 'mysql2';
import { Configuration, OpenAIApi } from "openai";
dotenv.config();
const port = 8080;


// const jobOpeningsData = JSON.parse(fs.readFileSync('job_openings.json', 'utf-8'));



// Create a connection pool
const pool = mysql.createPool({
    host: process.env.SQL_HOST_NAME,
    user:  process.env.SQL_USER_NAME,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE,
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
        const jobOpeningsInfo =  await JSON.stringify(jobOpeningsData.map(job => ({
            Title: job.jobtitle,
            companyName: job.companyName,
            Industry: job.industry,
            Stream: job.stream,
            qualification: job.qualification,
            Nature: job.job_nature,
            location: job.location,
            experience :job.experience,
            // Salary : job.minimumsalary,
            // CGPA_Required : job.
            // Responsibilities : job.responsibilities
        })));
        
        const placementPrompt = `${prompt} for MyFuse.In . You are the Job Placement Portal. You can find the latest job opening information in ${jobOpeningsInfo}  this data . If User asked the all the job then provide  all the jobs listed in database `;
         // Get response from OpenAI API
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `${placementPrompt}`,
            temperature: 0.8,
            max_tokens: 300,
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



app.post('/normalbot', async (req, res) => {
    try {
        
        const question = req.body.question;
        const placementPrompt = `${question} for MyFuse.In . You are the Job Placement Portal. You can find the latest job opening information `;
         // Get response from OpenAI API
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `${placementPrompt}`,
            temperature: 0.8,
            max_tokens: 300,
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