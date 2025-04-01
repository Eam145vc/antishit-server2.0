// utils/verify-imports.js
// Utilidad para verificar que todos los controladores y modelos están correctamente definidos

const fs = require('fs');
const path = require('path');

function verifyModels() {
  console.log('Verificando modelos...');
  const modelsDir = path.join(__dirname, '../models');
  
  try {
    const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));
    
    modelFiles.forEach(file => {
      const modelPath = path.join(modelsDir, file);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(modelPath)) {
        console.error(`⚠️ Archivo de modelo no encontrado: ${modelPath}`);
        return;
      }
      
      // Leer contenido del archivo
      const content = fs.readFileSync(modelPath, 'utf8');
      
      // Verificar importación de mongoose
      if (!content.includes('const mongoose = require(\'mongoose\')') && 
          !content.includes('const mongoose = require("mongoose")')) {
        console.error(`⚠️ Falta importación de mongoose en: ${file}`);
      } else {
        console.log(`✅ Importación de mongoose correcta en: ${file}`);
      }
      
      // Verificar exportación del modelo
      if (!content.includes('module.exports =')) {
        console.error(`⚠️ Falta exportación del modelo en: ${file}`);
      } else {
        console.log(`✅ Exportación correcta en: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error verificando modelos:', error);
  }
}

function verifyControllers() {
  console.log('\nVerificando controladores...');
  const controllersDir = path.join(__dirname, '../controllers');
  
  try {
    const controllerFiles = fs.readdirSync(controllersDir).filter(file => file.endsWith('.js'));
    
    controllerFiles.forEach(file => {
      const controllerPath = path.join(controllersDir, file);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(controllerPath)) {
        console.error(`⚠️ Archivo de controlador no encontrado: ${controllerPath}`);
        return;
      }
      
      // Leer contenido del archivo
      const content = fs.readFileSync(controllerPath, 'utf8');
      
      // Verificar exportaciones
      if (!content.includes('module.exports =')) {
        console.error(`⚠️ Falta exportación en el controlador: ${file}`);
      } else {
        console.log(`✅ Exportación correcta en: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error verificando controladores:', error);
  }
}

function verifyRoutes() {
  console.log('\nVerificando rutas...');
  const routesDir = path.join(__dirname, '../routes');
  
  try {
    const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
    
    routeFiles.forEach(file => {
      const routePath = path.join(routesDir, file);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(routePath)) {
        console.error(`⚠️ Archivo de ruta no encontrado: ${routePath}`);
        return;
      }
      
      // Leer contenido del archivo
      const content = fs.readFileSync(routePath, 'utf8');
      
      // Verificar importación express
      if (!content.includes('const express = require(\'express\')') && 
          !content.includes('const express = require("express")')) {
        console.error(`⚠️ Falta importación de express en: ${file}`);
      } else {
        console.log(`✅ Importación de express correcta en: ${file}`);
      }
      
      // Verificar creación del router
      if (!content.includes('const router = express.Router()')) {
        console.error(`⚠️ Falta creación del router en: ${file}`);
      } else {
        console.log(`✅ Creación del router correcta en: ${file}`);
      }
      
      // Verificar exportación del router
      if (!content.includes('module.exports = router')) {
        console.error(`⚠️ Falta exportación del router en: ${file}`);
      } else {
        console.log(`✅ Exportación del router correcta en: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error verificando rutas:', error);
  }
}

// Ejecutar todas las verificaciones
function verifyAll() {
  verifyModels();
  verifyControllers();
  verifyRoutes();
  console.log('\nVerificación completa.');
}

// Permitir uso como script independiente
if (require.main === module) {
  verifyAll();
} else {
  module.exports = { verifyModels, verifyControllers, verifyRoutes, verifyAll };
}
