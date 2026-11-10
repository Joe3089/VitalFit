// jest.config.mjs
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Proporciona la ruta a tu aplicación Next.js para cargar archivos next.config.js y .env en tu entorno de prueba
  dir: './',
})

// Agrega cualquier configuración personalizada de Jest que desees aquí
/** @type {import('jest').Config} */
const config = {
// Agrega más opciones de configuración debajo
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Descomenta si creas jest.setup.js
  testEnvironment: 'jest-environment-jsdom',
  preset: 'ts-jest', // Necesario para TypeScript
}

// createJestConfig es exportado así para asegurar que next/jest pueda cargar la configuración de Next.js
export default createJestConfig(config)
