require('dotenv').config();
const express = require('express');
const sql = require('mssql');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());

// Configuración SQL Server
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  port: 1433
};

app.post('/ine', async (req, res) => {
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

  try {
    await sql.connect(config);

    const result = await sql.query`
      INSERT INTO ine_datos
      (nombre, apellido_paterno, apellido_materno, curp, clave_elector, fecha_nacimiento, sexo, estado, municipio, seccion, anio_emision, vigencia, domicilio)
      VALUES
      (${nombre}, ${apellido_paterno}, ${apellido_materno}, ${curp}, ${clave_elector}, ${fecha_nacimiento}, ${sexo}, ${estado}, ${municipio}, ${seccion}, ${anio_emision}, ${vigencia}, ${domicilio})
    `;

    res.send('Datos guardados correctamente');
  } catch (error) {
    console.error('Error al guardar:', error);
    res.status(500).send('Error al guardar los datos');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});



app.get('/ines', async (req, res) => {
  try {
    await sql.connect(config);

    const result = await sql.query`SELECT * FROM ine_datos`;

    res.json(result.recordset);  // devuelve un array con todos los registros
  } catch (error) {
    console.error('Error al consultar todos los datos:', error);
    res.status(500).send('Error al consultar los datos');
  }
});

