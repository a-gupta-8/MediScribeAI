const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config(); // For environment variables


const openai = new OpenAI({
    apiKey: "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"
});


const app = express();
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // For form data


let patients = []; // Temporary in-memory storage




app.get('/', (req, res) => {
    res.render('index'); // This assumes you have a 'landing.ejs' file in your 'views' folder
});


// Get Symptom Diagnosis
app.post('/patients/get-symptom/:id', async (req, res) => {
    const patientId = parseInt(req.params.id);
    const patient = patients.find(p => p.id === patientId);


    if (!patient) {
        return res.status(404).send('Patient not found');
    }


    try {
        // Call OpenAI API with patient description
        const response = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a helpful medical assistant.' },
                { role: 'user', content: `Patient description: ${patient.description}. What are possible diagnoses based on this description?` }
            ],
            model: 'gpt-3.5-turbo',
            max_tokens: 150,
            temperature: 0.7
        });


        // Extract the response
        const diagnosis = response.choices[0].message.content;
       
        // Return top 3 diagnoses (you might want to refine parsing)
        const conditions = diagnosis.split('\n').slice(0, 5);


        res.json({ conditions });
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).send('Error retrieving diagnosis');
    }
});


// Render the patients page
// Patients Page - View all patients
app.get('/patients', (req, res) => {
    res.render('patients', { patients });
});


// Add a new patient
app.post('/patients/add', (req, res) => {
    const { name, age, condition, description } = req.body;
    patients.push({ id: Date.now(), name, age, condition, description });
    res.redirect('/patients');
});


// Delete a patient
app.post('/patients/delete/:id', (req, res) => {
    const patientId = parseInt(req.params.id);
    patients = patients.filter(patient => patient.id !== patientId);
    res.redirect('/patients');
});


// Update patient details (edit page)
app.get('/patients/edit/:id', (req, res) => {
    const patient = patients.find(p => p.id == req.params.id);
    if (patient) {
        res.render('editPatient', { patient });
    } else {
        res.redirect('/patients');
    }
});


app.get('/transcribe', (req, res) => {
    res.render('transcribe');
});
// Update patient details (POST request)
app.post('/patients/update/:id', (req, res) => {
    const patientId = parseInt(req.params.id);
    const { name, age, condition, description } = req.body;
    patients = patients.map(patient =>
        patient.id === patientId ? { id: patientId, name, age, condition, description } : patient
    );
    res.redirect('/patients');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));





