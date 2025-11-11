from typing import List, Dict, Union
import json
import inspect
from apps.services.tool_register.tool_registry import TOOL_REGISTRY
from apps.services.llm.llm_service import call_llm
from apps.services.context.intelligent_context import IntelligentContext
from apps.services.utils.utils import filter_valid_args, should_continue_after_error, get_function_signature
from apps.services.prompt.prompt_base import build_prompt
from apps.services.prompt.utils_prompt import clean_llm_response


async def plan_method_sequence(tools: Union[str, List[str]], methods: List[Dict], user_input: str, task_type: str):
    """Planifica la secuencia de métodos usando Gemini (compatible con una o varias herramientas)"""

    # 🔹 1️⃣ Normalizar herramientas: aceptar string o lista
    tool_list = tools if isinstance(tools, list) else [tools]

    # 🔹 2️⃣ Construir el prompt dinámicamente
    # build_prompt debe poder manejar múltiples herramientas
    # (si no lo hace, te indico más abajo cómo ajustarlo)
    planning_prompt = build_prompt(tool_list, methods, user_input, task_type)

    plan_text = await call_llm(planning_prompt)
    
    # 🧹 Limpieza antes de parsear
    plan_text = clean_llm_response(plan_text)
    print(f"📋 Plan generado por Gemini: {plan_text}")

    try:
        plan = json.loads(plan_text)
        sequence = plan.get("sequence", [])

        # 🔹 3️⃣ Validar métodos solo cuando haya UNA herramienta
        if len(tool_list) == 1:
            valid_method_names = {method['name'] for method in methods}
            for step in sequence:
                if step.get("action") == "llm" or step.get("iterate"):
                    continue

                method_name = step.get("method")
                if method_name and method_name not in valid_method_names:
                    print(f"❌ ERROR: Método '{method_name}' no existe en {tool_list[0]}")
                    print(f"   Métodos válidos: {list(valid_method_names)}")
                    return []
        else:
            # 🔹 Si hay varias herramientas, dejamos que el LLM planifique libremente
            print(f"🔀 Secuencia multi-herramienta detectada: {tool_list}")

        # 🔹 4️⃣ Retornar secuencia unificada
        return sequence

    except json.JSONDecodeError:
        print(f"❌ Error parseando plan: {plan_text}")
        return []

    

async def execute_iteration_step(step: dict, context: IntelligentContext, tool: dict, user_input: str):
    """Ejecuta un paso con iteración"""

    def extract_iterable(source_data, source_name="(unknown)"):
        """Encuentra la lista válida para iterar dentro de una fuente de datos"""
        # Caso 1: Ya es lista
        if isinstance(source_data, list):
            return source_data

        # Caso 2: Diccionario → buscar listas candidatas
        if isinstance(source_data, dict):
            candidate_lists = []
            for k, v in source_data.items():
                if isinstance(v, list) and all(isinstance(i, dict) for i in v):
                    candidate_lists.append((k, v))

            if len(candidate_lists) == 1:
                return candidate_lists[0][1]

            if len(candidate_lists) > 1:
                # Heurística: preferir lista cuyos elementos tengan "id"
                for _, v in candidate_lists:
                    if all(isinstance(i, dict) and "id" in i for i in v):
                        return v
                return candidate_lists[0][1]  # fallback

        raise ValueError(f"No se encontró array válido en '{source_name}' para iterar")


    method_name = step.get("method")
    source = step.get("source")
    base_args = step.get("args", {})
    
    # Obtener array para iterar
    raw_data = context.resolve_parameter(source)
    try:
        iteration_array = extract_iterable(raw_data, source)
    except Exception as e:
        #return {"success": False, "error": str(e)}
        return {"success": False, "error": f"No se encontró array válido en '{source}' para iterar"}
    
    print(f"🔄 Iterando {method_name} sobre {len(iteration_array)} elementos")
    
    iteration_results = []
    method_meta = tool.get(method_name)
    method_func = method_meta.get("func")
    
    for i, item in enumerate(iteration_array):
        try:
            # Preparar argumentos para esta iteración
            iteration_args = base_args.copy()
            
            # Reemplazar "iterate_value" con el valor actual
            for param_name, param_value in list(iteration_args.items()):
                if param_value == "iterate_value":
                    iteration_args[param_name] = item
                elif isinstance(param_value, str) and "iterate_value" in param_value:
                    # Para casos como "process_iterate_value" 
                    iteration_args[param_name] = param_value.replace("iterate_value", str(item))

            # Resolver otros parámetros dinámicos
            resolved_args = {}
            for param_name, param_value in iteration_args.items():
                if param_value == "dynamic":
                    resolved_value = context.resolve_parameter(param_name)
                    resolved_args[param_name] = resolved_value
                else:
                    resolved_args[param_name] = param_value
            
            # Filtrar argumentos válidos
            filtered_args = filter_valid_args(method_func, resolved_args)
            
            # Ejecutar método
            if inspect.iscoroutinefunction(method_func):
                result = await method_func(**filtered_args)
            else:
                result = method_func(**filtered_args)
            
            # Almacenar resultado individual
            context.store_result(f"{method_name}_{i}", result)
            iteration_results.append({"index": i, "item": item, "result": result, "success": True})
            
            print(f"   ✅ Iteración {i+1}/{len(iteration_array)} completada")
            
        except Exception as e:
            error_msg = f"Error en iteración {i}: {str(e)}"
            iteration_results.append({"index": i, "item": item, "error": error_msg, "success": False})
            print(f"   ❌ {error_msg}")
    
    # Almacenar resultados consolidados
    context.data[f"{method_name}_iterations"] = iteration_results
    successful_results = [r["result"] for r in iteration_results if r["success"]]
    context.data[f"{method_name}_iteration_results"] = successful_results
    
    success_count = len([r for r in iteration_results if r["success"]])
    return {
        "success": True, 
        "result": f"Completadas {success_count}/{len(iteration_array)} iteraciones",
        "iteration_results": iteration_results
    }

## Ejecutar SECUENCIA 

async def execute_method_sequence(tool_name: Union[str, List[str]], sequence: List[Dict], user_input: str, context: IntelligentContext):
    """Ejecuta una secuencia de métodos con contexto inteligente (soporta múltiples herramientas)"""

    # 🔹 1️⃣ Normalizar herramientas: aceptar string o lista
    tool_list = tool_name if isinstance(tool_name, list) else [tool_name]

    results = []

    for i, step in enumerate(sequence):

        # 🔹 2️⃣ Detectar herramienta específica para este paso
        # Si no se especifica "tool" dentro del step, usar la primera como fallback
        step_tool_name = step.get("tool", tool_list[0])
        step_tool = TOOL_REGISTRY.get(step_tool_name)

        if not step_tool:
            error_msg = f"Tool '{step_tool_name}' no encontrada"
            results.append({"step": i+1, "success": False, "error": error_msg})
            print(f"❌ {error_msg}")
            continue

        # === CASOS DE PASO LLM ===
        if step.get("action") == "llm":
            print(f"🤖 Paso {i+1}: Procesamiento LLM")
            result = await execute_llm_step(step, context, user_input)
            results.append({
                "step": i+1,
                "type": "llm",
                "task": step.get("task", "procesamiento"),
                **result
            })

            if not result["success"]:
                can_continue = await should_continue_after_error(
                    user_input, "llm_processing", result.get("error", ""), i+1, len(sequence)
                )
                if not can_continue:
                    return {"success": False, "error": result.get("error"), "results": results, "stopped_at_step": i+1}
            continue

        # === CASOS DE ITERACIÓN ===
        elif step.get("iterate"):
            print(f"🔄 Paso {i+1}: Iteración de {step.get('method')} en {step_tool_name}")
            result = await execute_iteration_step(step, context, step_tool, user_input)
            results.append({
                "step": i+1,
                "type": "iteration",
                "method": step.get("method"),
                "tool": step_tool_name,
                **result
            })

            if not result["success"]:
                can_continue = await should_continue_after_error(
                    user_input, step.get("method"), result.get("error", ""), i+1, len(sequence)
                )
                if not can_continue:
                    return {"success": False, "error": result.get("error"), "results": results, "stopped_at_step": i+1}
            continue

        # === PASO DE MÉTODO NORMAL ===
        method_name = step.get("method")
        method_args = step.get("args", {})

        print(f"🔧 Paso {i+1}: Ejecutando {step_tool_name}.{method_name}")

        # Resolver argumentos dinámicos
        resolved_args = {}
        for param_name, param_value in method_args.items():
            if param_value == "dynamic":
                resolved_value = context.resolve_parameter(param_name)
                resolved_args[param_name] = resolved_value
            else:
                resolved_value = await context.generate_content_if_needed(param_name, param_value, user_input)
                resolved_args[param_name] = resolved_value if resolved_value else param_value

        print(f"   Args resueltos: {resolved_args}")

        # ✅ Inyectar user_id si está en el contexto
        if "user_id" in context.data:
            resolved_args["user_id"] = context.data["user_id"]
            print(f"   ✅ user_id inyectado: {context.data['user_id']}")

        try:
            if isinstance(step_tool, dict):
                method_meta = step_tool.get(method_name)
                if not method_meta:
                    error_msg = f"Método '{method_name}' no encontrado en {step_tool_name}"
                    results.append({"method": method_name, "success": False, "error": error_msg})
                    print(f"❌ {error_msg}")
                    return {"success": False, "error": error_msg, "results": results}

                method_func = method_meta.get("func")
                method_signature = get_function_signature(method_func)
                filtered_args = filter_valid_args(method_func, resolved_args)

                if inspect.iscoroutinefunction(method_func):
                    result = await method_func(**filtered_args)
                else:
                    result = method_func(**filtered_args)

                # 🔹 Guardar resultado contextualizado por herramienta y método
                context.store_result(f"{step_tool_name}.{method_name}", result, method_signature)

                results.append({
                    "tool": step_tool_name,
                    "method": method_name,
                    "success": True,
                    "result": str(result)[:200] + "..." if len(str(result)) > 200 else str(result)
                })
                print(f"✅ Paso {i+1} completado ({step_tool_name}.{method_name})")

            else:
                # Herramienta simple (caso raro)
                if inspect.iscoroutinefunction(step_tool):
                    result = await step_tool(**resolved_args)
                else:
                    result = step_tool(**resolved_args)

                context.store_result(step_tool_name, result)
                results.append({"method": step_tool_name, "success": True, "result": str(result)})
                print(f"✅ Herramienta simple ejecutada ({step_tool_name})")

        except Exception as e:
            error_msg = f"Error ejecutando {step_tool_name}.{method_name}: {str(e)}"
            results.append({"method": method_name, "success": False, "error": error_msg})
            print(f"❌ {error_msg}")

            can_continue = await should_continue_after_error(user_input, method_name, str(e), i+1, len(sequence))
            if not can_continue:
                return {"success": False, "error": error_msg, "results": results, "stopped_at_step": i+1}

    return {
        "success": True,
        "results": results,
        "context_data": context.data,
        "total_steps": len(sequence)
    }



    #IMPORTAR DE intelligente_context.py=>

async def execute_llm_step(step: dict, context: IntelligentContext, user_input: str):
    """Ejecuta un paso de procesamiento LLM"""
    task = step.get("task", "procesar información")
    
    # Recopilar todo el contexto disponible de forma inteligente
    processed_data = []
    context_content = ""
    
    # Obtener datos de los métodos ejecutados previamente
    for result_info in context.method_results:
        method = result_info['method']
        result = result_info['result']
        
        processed_data.append({
            "method": method,
            "result_summary": str(result)[:300] + "..." if len(str(result)) > 300 else str(result)
        })
    
    # Obtener el contenido más relevante del contexto
    if "last_content" in context.data:
        context_content = context.data["last_content"]
        print("Este es el contenido que le llega al Modelo en Esecute_step_llm", context_content)
    
    llm_prompt = f"""
    
    SOLICITUD ORIGINAL DEL USUARIO:
    "{user_input}"

    TAREA ESPECÍFICA A EJECUTAR:
    {task}

    DATOS DISPONIBLES PARA LA TAREA:
    --- CONTENIDO PRINCIPAL ---
    {context_content}

    --- CONTEXTO ADICIONAL ---
    {json.dumps(dict(list(context.data.items())[:3]), indent=2, ensure_ascii=False)}

    INSTRUCCIONES PRINCIPALES:
    - ELIMINA FUNCIONES, METODOS O COSAS TECNICAS DE LA INFORMACIÓN RECIBIDA 
    - Extraer INFORMACION DEL FORMATO RECIBIDO,
    - Redactar la Respuesta
    - GENERAR LA RESPUESTA EN EL FORMATO SOLICITADO 
    - NO ENTREGUES LA RESPUESTA EN JSON
    - NO TE PREOCUPES POR CLAVES, AQUI ENTREGAS LA RESPUESTA DE FORMA DIRECTA
    - No incluyas user_id

    
    
    """

    def normalize_llm_output(llm_output: str) -> str:
        """Limpia la salida del LLM para quedarnos con HTML o texto puro."""
        try:
            data = json.loads(llm_output)
            if isinstance(data, dict):
                # Caso 1: parámetros explícitos
                params = data.get("parameters") or data
                if "body" in params:
                    return params["body"]

                # Caso 2: tool_code con send_email(...)
                if "tool_code" in data and isinstance(data["tool_code"], str):
                    tool_code = data["tool_code"]
                    if "body=" in tool_code:
                        start = tool_code.find("body=") + len("body=")
                        body_part = tool_code[start:].strip()
                        # quitar comillas si están presentes
                        if body_part.startswith(("'", '"')) and body_part.endswith(("'", '"')):
                            body_part = body_part[1:-1]
                        return body_part
        except Exception:
            pass

        # Si no era JSON o no encontramos body, devolvemos texto limpio
        return llm_output.strip()


    
    try:
        from apps.services.llm.llm_service import call_llm
        llm_result = await call_llm(llm_prompt)
        
        # Limpiar resultado si viene envuelto en markdown
        if llm_result.startswith('```html'):
            llm_result = llm_result.replace('```html', '').replace('```', '').strip()
        elif llm_result.startswith('```'):
            llm_result = llm_result.split('\n', 1)[-1].rsplit('```', 1)[0].strip()

        llm_result = normalize_llm_output(llm_result)
        
        # Almacenar resultado LLM en contexto
        context.data["llm_result"] = llm_result
        context.data["last_content"] = llm_result
        
        print(f"🤖 LLM procesó: {task}")
        print(f"📝 Contenido generado: {len(llm_result)} caracteres")
        print(f"📝 Preview: {llm_result[:200]}...")
        return {"success": True, "result": llm_result}  # ✅ Retorna COMPLETO
        
    except Exception as e:
        error_msg = f"Error en procesamiento LLM: {str(e)}"
        print(f"❌ {error_msg}")
        return {"success": False, "error": error_msg}
    

