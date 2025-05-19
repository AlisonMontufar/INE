const express = require('express');
const mysql = require('mysql2');
const path = require('path');
require('dotenv').config();
const { body, validationResult } = require('express-validator'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'registro_ine'
});

db.connect(err => {
  if (err) throw err;
  console.log('Conectado a MySQL');
});

// POST
app.post('/ine', [
  body('nombre').notEmpty().withMessage('Nombre es requerido').isAlpha('es-ES', {ignore: ' '}).withMessage('Nombre solo debe tener letras y espacios'),
  body('apellido_paterno').notEmpty().withMessage('Apellido paterno es requerido').isAlpha('es-ES', {ignore: ' '}),
  body('apellido_materno').optional().isAlpha('es-ES', {ignore: ' '}),
  body('curp').matches(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/).withMessage('CURP inválido'),
  body('clave_elector').isLength({ min: 13, max: 13 }).withMessage('Clave elector debe tener 13 caracteres'),
  body('fecha_nacimiento').isDate().withMessage('Fecha de nacimiento inválida').custom(value => {
    if (new Date(value) > new Date()) {
      throw new Error('Fecha de nacimiento no puede ser futura');
    }
    return true;
  }),
  body('sexo').isIn(['M', 'F']).withMessage('Sexo debe ser "M" o "F"'),
  body('estado').notEmpty().isAlpha('es-ES', {ignore: ' '}),
  body('municipio').notEmpty().isAlpha('es-ES', {ignore: ' '}),
  body('seccion').isInt({ min: 1 }),
  body('anio_emision').isInt({ min: 2010, max: new Date().getFullYear() }),
  body('vigencia').isInt().custom((value, { req }) => {
    if (value < req.body.anio_emision) {
      throw new Error('Vigencia debe ser mayor o igual al año de emisión');
    }
    return true;
  }),
  body('domicilio').notEmpty()
], (req, res) => {
  // Validacion de errores
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  //Insert
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    curp,
    clave_elector,
    fecha_nacimiento,
    sexo,
    estado,
    municipio,
    seccion,
    anio_emision,
    vigencia,
    domicilio
  } = req.body;

  const query = `
    INSERT INTO ine_datos
    (nombre, apellido_paterno, apellido_materno, curp, clave_elector, fecha_nacimiento, sexo, estado, municipio, seccion, anio_emision, vigencia, domicilio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [
    nombre,
    apellido_paterno,
    apellido_materno,
    curp,
    clave_elector,
    fecha_nacimiento,
    sexo,
    estado,
    municipio,
    seccion,
    anio_emision,
    vigencia,
    domicilio
  ], (err, result) => {
    if (err) {
      console.error('Error al insertar:', err);
      return res.status(500).send('Error al guardar los datos');
    }
    res.send('Datos guardados correctamente');
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
