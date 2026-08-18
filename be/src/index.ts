import dotenv from 'dotenv';

// Cargar variables de entorno ANTES de importar cualquier módulo que las lea
dotenv.config();

import app from './app';
import { verifyMailer } from './lib/mailer';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  // se ve aquí y no cuando un usuario intenta recuperar su contraseña.
  void verifyMailer();
});
