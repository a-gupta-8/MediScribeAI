
const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config(); // Load environment variables

const openai = new OpenAI({
    apiKey: "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"
});

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Enables JSON parsing for API requests

app.post('/transcribe/summarize', async (req, res) => {
    console.log("Received request at /transcribe/summarize:", req.body); // Debugging

    const { transcript } = req.body;

    if (!transcript || transcript.trim() === "") {
        console.error("ERROR: No transcript provided.");
        return res.status(400).json({ error: 'No text provided for summarization.' });
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are an AI that summarizes medical conversations.' },
                { role: 'user', content: `analzye the doctor and patient conversation and summarize this conversation with format that categorizes syptoms, history, treatment plan, follow up. :\n\n${transcript}` }
            ],
            max_tokens: 200,
            temperature: 0.5
        });

        if (!response.choices || response.choices.length === 0) {
            throw new Error("OpenAI response was empty.");
        }

        res.json({ summary: response.choices[0].message.content });

    } catch (error) {
        console.error('Error calling OpenAI API:', error.message);
        res.status(500).json({ error: 'Error generating summary' });
    }
});


let patients = []; // Temporary in-memory storage

// Home Page
app.get('/', (req, res) => {
    res.render('index');
});

// Get Symptom Diagnosis
app.post('/patients/get-symptom/:id', async (req, res) => {
    const patientId = parseInt(req.params.id);
    const patient = patients.find(p => p.id === patientId);

    if (!patient) {
        return res.status(404).send('Patient not found');
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful medical assistant.' },
                { role: 'user', content: `Patient description: ${patient.description}. What are possible diagnoses based on this description?` }
            ],
            max_tokens: 150,
            temperature: 0.7
        });

        if (!response.choices || response.choices.length === 0) {
            throw new Error("OpenAI response was empty.");
        }

        res.json({ conditions: response.choices[0].message.content.split('\n').slice(0, 5) });

    } catch (error) {
        console.error('Error calling OpenAI API:', error.message);
        res.status(500).json({ error: 'Error retrieving diagnosis' });
    }
});

// Transcribe Route - Secure Summarization API
app.post('/transcribe/summarize', async (req, res) => {
    const { transcript } = req.body;

    if (!transcript || transcript.trim() === "") {
        return res.status(400).json({ error: 'No text provided for summarization.' });
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are an AI that summarizes medical conversations.' },
                { role: 'user', content: `Summarize this conversation:\n\n${transcript}` }
            ],
            max_tokens: 200,
            temperature: 0.5
        });

        if (!response.choices || response.choices.length === 0) {
            throw new Error("OpenAI response was empty.");
        }

        res.json({ summary: response.choices[0].message.content });

    } catch (error) {
        console.error('Error calling OpenAI API:', error.message);
        res.status(500).json({ error: 'Error generating summary' });
    }
});

// Patients Management Routes
app.get('/patients', (req, res) => res.render('patients', { patients }));
app.post('/patients/add', (req, res) => {
    const { name, age, condition, description } = req.body;
    patients.push({ id: Date.now(), name, age, condition, description });
    res.redirect('/patients');
});
app.post('/patients/delete/:id', (req, res) => {
    patients = patients.filter(patient => patient.id !== parseInt(req.params.id));
    res.redirect('/patients');
});
app.get('/patients/edit/:id', (req, res) => {
    const patient = patients.find(p => p.id == req.params.id);
    patient ? res.render('editPatient', { patient }) : res.redirect('/patients');
});
app.post('/patients/update/:id', (req, res) => {
    const { name, age, condition, description } = req.body;
    patients = patients.map(patient =>
        patient.id === parseInt(req.params.id) ? { id: patient.id, name, age, condition, description } : patient
    );
    res.redirect('/patients');
});

// Transcription Page
app.get('/transcribe', (req, res) => res.render('transcribe'));

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
