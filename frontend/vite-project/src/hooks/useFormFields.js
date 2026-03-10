import { useState } from "react";
import { validateEmail } from "../services/validInput";

export const MAX_EMAIL_LENGTH = 80;
export const MAX_PASSWORD_LENGTH = 32;

export const useFormFields = () => {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [code, setCode]             = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [step, setStep]             = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "", name: ""});

  const handleEmailChange = (e) => {
    const value = e.target.value;
    if (value.length > MAX_EMAIL_LENGTH) {
      setFieldErrors(prev => ({ ...prev, email: `Máximo ${MAX_EMAIL_LENGTH} caracteres` }));
      return;
    }
    setEmail(value);
    if (value && !validateEmail(value)) {
      setFieldErrors(prev => ({ ...prev, email: "Formato de correo no válido" }));
    } else {
      setFieldErrors(prev => ({ ...prev, email: "" }));
    }
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setFieldErrors(prev => ({ ...prev, email: "Formato de correo no válido" }));
    } else {
      setFieldErrors(prev => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    if (value.length > MAX_PASSWORD_LENGTH) {
      setFieldErrors(prev => ({ ...prev, password: `Máximo ${MAX_PASSWORD_LENGTH} caracteres` }));
      return;
    }
    setPassword(value);
    setFieldErrors(prev => ({ ...prev, password: "" }));
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value.replace(/\D/g, ""));
  };

  return {
    email, password, code, error, loading, step, fieldErrors,
    setEmail, setPassword, setCode, setError, setLoading, setStep, setFieldErrors,
    handleEmailChange, handleEmailBlur, handlePasswordChange, handleCodeChange,
  };
};