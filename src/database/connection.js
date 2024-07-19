import sql from "mssql";

export const dbSettings = {
  user: "sa",
  password: "12Stars",
  server: "localhost",
  database: "BBraunPharmaDB",
  options: {
    encrypt: false, // for azure
    trustServerCertificate: true, // change to true for local dev / self-signed certs
  },
};

export const getConnection = async () => {
  try {
    const pool = await sql.connect(dbSettings);  
    return pool; 
  } catch (error) {
    console.error("Error al conectar a SQL server", error);
  }
};


