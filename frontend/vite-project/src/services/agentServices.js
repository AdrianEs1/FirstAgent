import api from './api';

//Función para RegistrarUsuario
export const fetchAgentRegister = async (data) => {
  try {
    const response = await api.post(`/api/auth/register`, data); //endpoint register
    return response.data; //token o mesaje JSON
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
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
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
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

//Funcion para dar ordenes sin estar logueado
export const fetchAgentTask = async data => {
  try{
    const response = await api.post('/ask', data);

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
    const response = await api.get(`/api/conversations/${conversationId}`, conversationId, { withCredentials: true});

    return response.data;
  
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
};

//Funcion para crear conversarcion



//Funcion para archivar conversacion por ID

export const deleteConversation = async (conversationId) => {
  try{
    const response = await api.delete(`/api/conversations/${conversationId}`, data, { withCredentials: true});

    return response.data;
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
};

//Funcion para buscar conversaciones por el titulo
export const seachConversation = async (conversationTitle) => {
  try{
    const response = await api.get(`/api/conversations/search/${conversationTitle}`, data, { withCredentials: true});

    return response.data;
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
  }
};


// ✅ NUEVOS: OAuth
export const connectOAuth = async (service = 'gmail') => {
  try{
    const response = await api.get(`/api/oauth/${service}/connect`, { withCredentials: true});

    return response.data;
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Ocurrió un error desconocido.";
    throw new Error(errorMessage);
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


