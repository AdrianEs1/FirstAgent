import api, {apipublic} from './api';

//Función para RegistrarUsuario
export const fetchAgentRegister = async (data) => {
  try {
    const response = await api.post(`/api/auth/register`, data); //endpoint register
    return response.data; //token o mesaje JSON
  } catch (error) {
    throw error
  }
};



//función para IniciarSesión
export const fetchAgentLogin = async (data) => {
  try{
    const response = await api.post(`/api/auth/login`, 
      data, 
      ); //endpoint login
    
    localStorage.setItem('token', response.data.access_token);

    return response.data //JSON y access_token
  } catch (error){
    throw error;
  }
}


//Funcion para Verificar cuenta atraves de un codigo

export const fetchAgentVerifyEmailCode = async (data) => {
  try{
    const response = await api.post(`/api/auth/verify-email`, 
      data, 
      ); //

    return response.data 
  } catch (error){
    const errorMessage = error.response?.data?.detail || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
}


export const fetchAgentResendEmailCode = async (data) => {
  try{
    const response = await api.post(`/api/auth/resend-verification-code`, 
      data, 
      ); //

    return response.data 
  } catch (error){
    const errorMessage = error.response?.data?.detail || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
}


//Funcion para obtener usuario actual
export const fetchCurrentUser = async () => {
  try{
    const response = await api.get('/api/auth/me', { withCredentials: true});

    return response.data;
  
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
};



//función para CerrarSesión
export const fetchAgentLogout = async () => {
  try{
    const response = await api.post('/api/auth/logout', {}, { withCredentials: true});

    return response.data;
  
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
};


//función para dar ordenes al Agente, cuando esta logueado

export const sendMessageToConversation = async (conversation_Id, message, user_id) => {
  try{
    const data = { message, user_id, conversation_id: conversation_Id || null};
    // conversationId se ignora porque /ask lo maneja automáticamente
    const response = await api.post('/ask', data, { withCredentials: true });
    return response.data;
  
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
};


// ✅ NUEVOS: Conversations
export const fetchConversations = async () => {

  try{
    const response = await api.get('/api/conversations', { withCredentials: true});

    return response.data;
  
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
};

//Funcion para obtener conversacion por ID

export const fetchConversationById = async (conversationId) => {
  try{
    const response = await api.get(`/api/conversations/${conversationId}`,{ withCredentials: true});

    return response.data;
  
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
};


////FUNCION PARA ENVIAR FILES AL BACKEND

export const fetchAgentSendFiles = async (files) => {
  try{
    const response = await api.post(`/api/agent/context/files`, files, { withCredentials: true});

    return response.data;
  
  } catch (error) {
    throw error;
  }
};

// Funcion que permite Obtener los Archivos del contexto del usuario
export const fetchAgentGetFiles = async () =>{
  try { 
    const response = await api.get('/api/agent/context/uploaded-files', {withCredentials: true});

    return response.data;
    
  } catch (error) {
    throw error;
    
  }
}

// Funcion que permite eliminar Archivos del contexto del usuario
export const fetchAgentDeleteFiles = async (file_id) =>{
  try {
    const response = await api.delete(`/api/agent/context/delete-file/${file_id}`, {withCredentials: true});

    return response.data
    
  } catch (error) {
    throw error;
  }
}


//Funcion para buscar conversaciones por el titulo
export const seachConversation = async (conversationTitle) => {
  try{
    const response = await api.get(`/api/conversations/search/${conversationTitle}`,{ withCredentials: true});

    return response.data;
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
};

//Funcion para obetener token OAUTH y permitir acceso a Google Picker
export const fetchAgentGetTokenOAUTH = async ()  => {
  try{
    const response = await api.get(`/api/oauth/drive/access-token`, { withCredentials: true});

    return response.data;
    
  } catch (error) {
    throw error;
  }
};



// ✅ NUEVO: Maneja reconexión sin OAuth
export const connectOAuth = async (service = "gmail") => {
  try {
    const data = await api
      .get(`/api/oauth/${service}/connect`, { withCredentials: true })
      .then((res) => res.data);

    // 🔹 Caso 1: Reconexion automática
    if (data.status === "reconnected") {
      // Puedes mostrar un toast, modal o alerta
      alert(data.message || `${service} reconectado correctamente.`);
      return {
        connected: true,
        service,
        reconnected: true,
        message: data.message,
      };
    }

    // 🔹 Caso 2: Flujo OAuth normal
    const { authorization_url } = data;

    if (!authorization_url) {
      throw new Error("No se recibió una URL de autorización válida.");
    }

    const popup = window.open(
      authorization_url,
      `${service}-oauth`,
      "width=600,height=700,left=200,top=100"
    );

    if (!popup) {
      throw new Error("Por favor, permite ventanas emergentes para continuar con la autenticación.");
    }

    // Esperar mensaje del callback OAuth
    return new Promise((resolve, reject) => {
      const handleMessage = (event) => {
        // ✅ Validar contra el origen de tu BACKEND
        const allowedOrigins = import.meta.env.VITE_URL

        console.log(`VITE_URL:${allowedOrigins}, Event Origin: ${event.origin}`)
        
        if (allowedOrigins !== event.origin) {
          console.log('⚠️ Origen no permitido:', event.origin);
          return;
        }
        
        if (event.data.app !== service) return;
        
        window.removeEventListener("message", handleMessage);
        popup.close();
        
        if (event.data.status === "success") {
          resolve({
            connected: true,
            email: event.data.email,
            service,
            reconnected: false,
          });
        } else {
          reject(new Error(event.data.message || "Error de autenticación"));
        }
      };
      window.addEventListener("message", handleMessage);
    });
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Error en conexión OAuth.";
    throw new Error(message);
  }
};



export const getOAuthStatus= async (service = 'gmail') => {
  try{
    const response = await api.get(`/api/oauth/${service}/status`, { withCredentials: true});

    return response.data;
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
}

export const disconnectOAuth = async (service = 'gmail') => {
  try{
    const response = await api.delete(`/api/oauth/${service}/disconnect`, { withCredentials: true});

    return response.data;
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
};


//Función para Enviar Correo de Recuperación de Cuenta 

export const fetchAgentForgotPassword = async (data) => {
  try {
    const response = await apipublic.post(`/api/auth/forgot-password`, data);
    return response.data; 
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
};


// Función para Restablecer Contraseña
export const fetchAgentResetPassword = async (data) => {
  try {
    const response = await api.post(`/api/auth/reset-password`, data);
    return response.data; 
  } catch (error){
    throw error;
  }
};


//Función para Enviar Correo de Eliminación de Cuenta
export const fetchAgentAccountDelection = async () => {
  try {
    const response = await api.post(`/api/auth/request-account-deletion`);
    return response.data; 
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
};


//Función para Confirmar Eliminación de Cuenta
export const fetchAgentConfirmDeleteAccount  = async (data) => {
  try {
    const response = await api.post(`/api/auth/confirm-account-deletion`, data);
    return response.data; 
  } catch (error) {
    throw error;
  }
};



//Funcion para eliminar conversacion por ID(Permanente)

export const fetchAgentDeleteConversation = async (conversationId) => {
  try{
    const response = await api.delete(`/api/conversations/${conversationId}/delete-permanent`, { withCredentials: true});

    return response.data;
    
  } catch (error) {
    const errorMessage = error.response?.data?.detail || "Ocurrió un error desconocido";
    throw new Error(errorMessage);
  }
};



