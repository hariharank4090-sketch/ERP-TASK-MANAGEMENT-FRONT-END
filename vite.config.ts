import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {

    // host: "localhost",
    // port: 5173

    //  host: "192.168.1.10",
    // port: 5173

  }
})
