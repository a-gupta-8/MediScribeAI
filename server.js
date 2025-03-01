
const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // For form data

let patients = []; // Temporary in-memory storage

// Home Page
app.get('/', (req, res) => {
    res.render('index');
});

// Patients Page - View all patients
app.get('/patients', (req, res) => {
    res.render('patients', { patients });
});

// Add a new patient
app.post('/patients/add', (req, res) => {
    const { name, age, condition } = req.body;
    patients.push({ id: Date.now(), name, age, condition });
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

// Update patient details (POST request)
app.post('/patients/update/:id', (req, res) => {
    const patientId = parseInt(req.params.id);
    const { name, age, condition } = req.body;
    patients = patients.map(patient =>
        patient.id === patientId ? { id: patientId, name, age, condition } : patient
    );
    res.redirect('/patients');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
