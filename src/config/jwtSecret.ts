// src/config/jwtSecret.ts
const JWT_SECRET: string =
    import.meta.env.VITE_JWT_SECRET ||
    "pukal orgin.in";

export default JWT_SECRET;
