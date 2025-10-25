import json
import inspect
from typing import List, Dict, Any, Optional, Union
from apps.services.llm.small_llm_service import call_small_llm
from apps.services.llm.llm_service import call_llm
from apps.services.tool_register.tool_registry import TOOL_REGISTRY
from apps.services.context.intelligent_context import IntelligentContext
from apps.services.flows.execute_simple_flow import select_simple_method
from apps.services.flows.execute_complex_flow import plan_method_sequence, execute_method_sequence
from apps.services.utils.utils import get_function_signature


async def evolved_self_reflection(tool_name: str, user_input: str) -> dict:
    """Self-reflection evolucionado que descubre métodos de la tool"""
    
    tool = TOOL_REGISTRY.get(tool_name)
    if not tool:
        return {"error": f"Tool '{tool_name}' no encontrada"}
    
    if not isinstance(tool, dict):
        # Tool simple (función directa)
        return {
            "methods": [{
                "name": tool_name,
                "signature": get_function_signature(tool),
                "description": "Herramienta simple"
            }]
        }
    
    # Tool compleja (múltiples métodos)
    methods = []
    for method_name, method_data in tool.items():
        func = method_data.get("func")
        if func:
            methods.append({
                "name": method_name,
                "signature": get_function_signature(func),
                "description": method_data.get("description", "")
            })
    
    return {"methods": methods}




async def generate_final_content_if_needed(context: IntelligentContext, user_input: str, results: List[Dict]) -> Optional[str]:
    """Genera contenido final basado en el contexto si es necesario - DEPRECATED"""
    # Esta función ya no es necesaria porque la generación se hace en tiempo real
    return None



## ESTA PARTE SE MANTIEN AQUÍ EN ESTE MÓDULO

async def orchestrator(user_input: str, user_id: str = None, context: str = "") -> dict:
    """Orquestador genérico y escalable"""
    
    # === 1. Decisión inicial con Groq ===
    available_tools = TOOL_REGISTRY.list_tools()
    print(f"🔧 Herramientas disponibles: {available_tools}")

    decision_prompt = f"""
    ENTRADA DEL USUARIO: "{user_input}"
    CONTEXTO: {context}

    HERRAMIENTAS DISPONIBLES: {available_tools}

    Clasifica la tarea según estos tipos EXACTOS:

    **SIMPLE**: Una sola acción directa con UNA herramienta y UN método
    Ejemplos:
    - ✅ "lista mis emails"
    - ✅ "envía un email a juan@email.com"  
    - ✅ "busca videos de Python"
    - ✅ "lee el primer email"

    **COMPLEX**: Una sola acción que requiere contenido detallado AUTO-GENERADO
    - ✅ "envía un email detallado sobre el proyecto Alpha a mi jefe"
    - ✅ "crea un reporte completo de ventas"
    - ✅ "genera una presentación sobre IA"

    **MULTI_TOOL**: Múltiples métodos secuenciales en la MISMA herramienta
    - ✅ "lee mis emails Y envíame un resumen"
    - ✅ "busca videos de IA Y analiza los más populares"  
    - ✅ "lista emails Y lee el primero Y responde"

    **CONVERSATION**: Chat general sin herramientas
    - ✅ "hola, ¿cómo estás?"
    - ✅ "explícame qué es la inteligencia artificial"
    - ✅ "cuéntame un chiste"

    REGLAS CLAVE:
    1. Si solo pide LISTAR/VER/BUSCAR algo = SIMPLE
    2. Si pide GENERAR contenido complejo = COMPLEX  
    3. Si usa "Y", "LUEGO", "DESPUÉS" o implica varios pasos = MULTI_TOOL
    4. Si es conversación general = CONVERSATION


    EJEMPLOS ESPECÍFICOS:
    - "lista mis últimos 5 emails" → {{"action": "gmail", "type": "simple"}}
    - "busca el video más popular" → {{"action": "youtube", "type": "simple"}}  
    - "envía email detallado sobre mi proyecto" → {{"action": "gmail", "type": "complex"}}
    - "lee emails y envía resumen" → {{"action": "gmail", "type": "multi_tool"}}
    - "Hola como estas?" → {{"action": "conversation"}}

    Analiza: "{user_input}"

    ¿Cuántas acciones distintas pide? ¿Requiere generación de contenido complejo?

    Recomendaciones para la REPSUESTA SOLO con JSON válido:
    -action: corresponde a las herramientas que tenemos disponibles, como gmail, o youtbe, etc...
    -type: tipo de acción
    FORMATO INDICADO REEMPLAZA LOS VALORES CORRECTAMENTE:

    {{"action": "tools", "type": "tipo"}}


    """

    decision_text = await call_small_llm(decision_prompt)
    print(f"🤖 Decisión de Groq: {decision_text}")

    try:
        decision = json.loads(decision_text)
    except json.JSONDecodeError:
        return {
            "success": False,
            "message": None,
            "error": f"[ORCH] Decisión inválida de Groq: {decision_text}"
        }

    action = decision.get("action")
    task_type = decision.get("type", "simple")

    # === 2. Manejar conversación general ===
    if action == "conversation":
        conversation_prompt = f"""
        El usuario ha dicho: "{user_input}"
        Contexto: {context}

        Responde de manera natural y conversacional.
        """
        response = await call_llm(conversation_prompt)
        
        return {
            "success": True,
            "message": response,
            "data": {"tools_used": []},
            "error": None
        }

    # === 3. Manejar herramientas ===
    if action not in available_tools:
        return {
            "success": False,
            "message": None,
            "error": f"[ORCH] Herramienta '{action}' no disponible"
        }

    # === 4. Self-reflection evolucionado ===
    reflection_result = await evolved_self_reflection(action, user_input)
    
    if "error" in reflection_result:
        return {
            "success": False,
            "message": None,
            "error": f"[ORCH] {reflection_result['error']}"
        }

    methods = reflection_result["methods"]
    print(f"📋 Métodos descubiertos para {action}: {[m['name'] for m in methods]}")

    # === 5. Planificación/Selección según tipo de tarea ===
    intelligent_context = IntelligentContext()

    if task_type == "simple":
        # Groq selecciona método simple
        selection = await select_simple_method(action, methods, user_input)
        
        if "error" in selection:
            return {
                "success": False,
                "message": None,
                "error": f"[ORCH] Error en selección simple: {selection['error']}"
            }
        
        sequence = [selection]
        
    elif task_type in ["complex", "multi_tool"]:
        # Gemini planifica secuencia
        sequence = await plan_method_sequence(action, methods, user_input, task_type)
        
        if not sequence:
            return {
                "success": False,
                "message": None,
                "error": "[ORCH] No se pudo generar secuencia de métodos"
            }

    # === 6. Ejecución con contexto inteligente ===
    intelligent_context = IntelligentContext()
    if user_id:
        intelligent_context.data["user_id"] = user_id  #
        print(f"🔑 user_id guardado en contexto: {user_id}")  # ← Agregar esto
    else:
        print("⚠️ user_id NO recibido en orchestrator")  # ← Y esto


    execution_result = await execute_method_sequence(action, sequence, user_input, intelligent_context)
    
    if not execution_result["success"]:
        return {
            "success": False,
            "message": None,
            "error": f"[ORCH] Error en ejecución: {execution_result.get('error', 'Error desconocido')}",
            "data": {"results": execution_result.get("results", [])}
        }

    # === 7. Resultado final ===
    results = execution_result["results"]
    successful_methods = []
    for r in results:
        if r.get("success", False):
            if "method" in r:
                successful_methods.append(r["method"])
            elif r.get("type") == "llm":
                successful_methods.append("llm_processing")
            elif r.get("type") == "iteration":
                successful_methods.append(f"{r.get('method', 'unknown')}_iteration")
            else:
                successful_methods.append("unknown_step")

    # Obtener el mensaje user-friendly del último método ejecutado
    response_message = "Operación completada"  # Mensaje por defecto

    # REEMPLAZAR todo el bloque if results: con:

    if results:
        # Obtener el último resultado exitoso
        last_successful_result = None
        for result in reversed(results):
            if result.get("success", False):
                last_successful_result = result
                break
    
        if last_successful_result:
            # Determinar el nombre del método según el tipo de paso
            if "method" in last_successful_result:
                # Paso de método normal
                method_name = last_successful_result["method"]
                context_key = f"{method_name}_result"
            elif last_successful_result.get("type") == "llm":
                # Paso LLM
                method_name = "llm_processing"
                context_key = "llm_result"
            elif last_successful_result.get("type") == "iteration":
                # Paso de iteración
                method_name = f"{last_successful_result.get('method', 'unknown')}_iteration"
                context_key = f"{last_successful_result.get('method', 'unknown')}_iteration_results"
            else:
                # Fallback
                method_name = "unknown_step"
                context_key = "last_content"
            
            # Buscar el mensaje user-friendly en los datos del contexto
            if context_key in intelligent_context.data:
                method_result = intelligent_context.data[context_key]
                
                # Si es el resultado directo del método (dict con 'message')
                if isinstance(method_result, dict) and "message" in method_result:
                    response_message = method_result["message"]
                # Si es contenido LLM (string HTML/texto)
                elif isinstance(method_result, str) and len(method_result) > 10:
                    # Para LLM, mostrar preview del contenido generado
                    if method_name == "llm_processing":
                        if method_result.startswith('<'):
                            response_message = f"🤖 **Contenido HTML generado exitosamente**\n\n📄 **Preview:** {method_result[:150]}..."
                        else:
                            response_message = f"🤖 **Contenido generado exitosamente**\n\n📄 **Preview:** {method_result[:200]}..."
                    else:
                        response_message = method_result[:300] + ("..." if len(method_result) > 300 else "")
                else:
                    response_message = f"✅ Ejecutado {method_name} correctamente"
            else:
                response_message = f"✅ Ejecutado {method_name} correctamente"

    # Y también corregir la línea de successful_methods:
    successful_methods = []
    for r in results:
        if r.get("success", False):
            if "method" in r:
                successful_methods.append(r["method"])
            elif r.get("type") == "llm":
                successful_methods.append("llm_processing")
            elif r.get("type") == "iteration":
                successful_methods.append(f"{r.get('method', 'unknown')}_iteration")
            else:
                successful_methods.append("unknown_step")



    # Para secuencias multi-tool, agregar info de la secuencia
    if len(successful_methods) > 1:
        sequence_info = f"\n\n📊 **Secuencia completada:** {' → '.join(successful_methods)}"
        response_message += sequence_info

    return {
        "success": True,
        "message": response_message,
        "data": {
            "tool_used": action,
            "methods_executed": successful_methods,
            "total_steps": len(results),
            "context_keys": list(intelligent_context.data.keys())
        },
        "error": None
    }