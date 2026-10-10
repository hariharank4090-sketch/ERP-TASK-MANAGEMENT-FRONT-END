

const { protocol, host } = window.location, baseURL: string = `${protocol}//${host}/api/`;


// const baseURL: string = import.meta.env.VITE_API_URL || "http://localhost:5001/api/";

export default baseURL;
