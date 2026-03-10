export const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,6}$/); // Limita el final a 2-6 letras
};