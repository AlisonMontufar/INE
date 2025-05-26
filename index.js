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

// ➕ INSERTAR en las 3 tablas
app.post('/credencial', async (req, res) => {
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

    // Insertar en persona y obtener id generado
    const personaResult = await sql.query`
      INSERT INTO persona (nombre, apellido_paterno, apellido_materno, curp)
      OUTPUT INSERTED.id
      VALUES (${nombre}, ${apellido_paterno}, ${apellido_materno}, ${curp})
    `;
    const personaId = personaResult.recordset[0].id;

    // Insertar en direccion con id de persona
    await sql.query`
      INSERT INTO direccion (id, estado, municipio, domicilio)
      VALUES (${personaId}, ${estado}, ${municipio}, ${domicilio})
    `;

    // Insertar en credencial con id de persona
    await sql.query`
      INSERT INTO credencial (id, clave_elector, fecha_nacimiento, sexo, seccion, anio_emision, vigencia)
      VALUES (${personaId}, ${clave_elector}, ${fecha_nacimiento}, ${sexo}, ${seccion}, ${anio_emision}, ${vigencia})
    `;

    res.json({ personaId });
  } catch (error) {
    console.error('Error al guardar:', error);
    res.status(500).send('Error al guardar los datos');
  }
});

// 🔍 CONSULTAR TODOS
app.get('/credenciales', async (req, res) => {
  try {
    await sql.connect(config);

    const result = await sql.query(`
      SELECT p.id, p.nombre, p.apellido_paterno, p.apellido_materno, p.curp,
             d.estado, d.municipio, d.domicilio,
             c.clave_elector, c.fecha_nacimiento, c.sexo, c.seccion, c.anio_emision, c.vigencia
      FROM persona p
      JOIN direccion d ON p.id = d.id
      JOIN credencial c ON p.id = c.id
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al consultar todos los datos:', error);
    res.status(500).send('Error al consultar los datos');
  }
});

// 🔍 CONSULTAR POR ID
app.get('/credencial/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await sql.connect(config);

    const result = await sql.query`
      SELECT p.id, p.nombre, p.apellido_paterno, p.apellido_materno, p.curp,
             d.estado, d.municipio, d.domicilio,
             c.clave_elector, c.fecha_nacimiento, c.sexo, c.seccion, c.anio_emision, c.vigencia
      FROM persona p
      JOIN direccion d ON p.id = d.id
      JOIN credencial c ON p.id = c.id
      WHERE p.id = ${id}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).send('Registro no encontrado');
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al consultar por ID:', error);
    res.status(500).send('Error en la consulta');
  }
});

// 🔍 CONSULTAR POR CURP
app.get('/credencial/curp/:curp', async (req, res) => {
  const { curp } = req.params;
  try {
    await sql.connect(config);

    const result = await sql.query`
      SELECT p.id, p.nombre, p.apellido_paterno, p.apellido_materno, p.curp,
             d.estado, d.municipio, d.domicilio,
             c.clave_elector, c.fecha_nacimiento, c.sexo, c.seccion, c.anio_emision, c.vigencia
      FROM persona p
      JOIN direccion d ON p.id = d.id
      JOIN credencial c ON p.id = c.id
      WHERE p.curp = ${curp}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).send('Registro no encontrado');
    }

    res.json(result.recordset[0]);
    
  } catch (error) {
    console.error('Error al consultar por CURP:', error);
    res.status(500).send('Error en la consulta');
  }
});

// 🔍 CONSULTAR POR CURP Y DEVOLVER SOLO ID
app.get('/credencial/curpID/:curp', async (req, res) => {
  const { curp } = req.params;
  try {
    await sql.connect(config);

    const result = await sql.query`
      SELECT p.id
      FROM persona p
      WHERE p.curp = ${curp}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Persona no encontrada con ese CURP' });
    }

    const personaId = result.recordset[0].id;
    res.json({ personaId });

  } catch (error) {
    console.error('Error al consultar por CURP:', error);
    res.status(500).json({ message: 'Error en la consulta' });
  }
});


// ❌ ELIMINAR POR CURP
app.delete('/credencial/curp/:curp', async (req, res) => {
  const { curp } = req.params;
  try {
    await sql.connect(config);

    // Buscar ID primero
    const result = await sql.query`SELECT id FROM persona WHERE curp = ${curp}`;
    if (result.recordset.length === 0) {
      return res.status(404).send('Registro no encontrado para eliminar');
    }

    const id = result.recordset[0].id;

    // Eliminar en orden para evitar conflictos por FK
    await sql.query`DELETE FROM credencial WHERE id = ${id}`;
    await sql.query`DELETE FROM direccion WHERE id = ${id}`;
    await sql.query`DELETE FROM persona WHERE id = ${id}`;

    res.send('Registro eliminado correctamente de las 3 tablas');
  } catch (error) {
    console.error('Error al eliminar por CURP:', error);
    res.status(500).send('Error en la eliminación');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
