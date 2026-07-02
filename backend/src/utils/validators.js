export const isValidEmail = (email) =>{
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

export const isValidPhoneNumber = (phoneNumber) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phoneNumber);
}

export const isValidPassword = (password) => {
    return password.length >= 8;
}

export const isValidName = (name) => {
    return name.length >= 3;
}