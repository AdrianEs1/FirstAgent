import google.generativeai as genai
import anyio
from config import GOOGLE_API_KEY

# Configura la API key
genai.configure(api_key=GOOGLE_API_KEY)

async def call_llm(prompt: str) -> str:
    """
    Envía un prompt al modelo Gemini y devuelve el texto generado (async safe)
    """
    enhanced_prompt = f"""
    Eres un aistente, que genera respuestas al usuario
    Responde en SOLO EN formato solicitado, ELIMINA backticks de la respuesta.
    
    Pregunta del usuario: {prompt}
    """

    def _sync_generate():
        model = genai.GenerativeModel("gemini-2.5-pro")
        return model.generate_content(enhanced_prompt)

    # Ejecutamos en un thread para no bloquear el loop de FastAPI
    response = await anyio.to_thread.run_sync(_sync_generate)

    if response and response.candidates:
        return response.candidates[0].content.parts[0].text.strip()
    else:
        return "No se pudo generar respuesta"

    
    """
    Envía un prompt al modelo Gemini y devuelve el texto generado (async safe)
    
    enhanced_prompt = f
    Responde de manera conversacional y natural, como si fueras un asistente hablando. 
    No uses formato markdown, asteriscos, o listas numeradas.
    Usa un lenguaje fluido y natural para ser leído en voz alta.
    
    Pregunta del usuario: {prompt}
    """

    