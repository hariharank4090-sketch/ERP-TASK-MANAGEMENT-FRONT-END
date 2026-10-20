

const { protocol, host } = typeof window !== "undefined" ? window.location : { protocol: "http:", host: "localhost:5173" };
const baseURL: string = import.meta.env.VITE_API_URL || `${protocol}//${host}/api/`;

export default baseURL;
