import json
from typing import Any
from apps.services.llm.llm_service import call_llm


class IntelligentContext:
    """Sistema de contexto inteligente que maneja automáticamente el mapeo entre métodos"""
    
    def __init__(self):
        self.data = {}
        self.method_results = []
        self.type_registry = {}
    
    def store_result(self, method_name: str, result: Any, method_signature: str = ""):
        """Almacena el resultado de un método con análisis automático"""
        result_info = {
            "method": method_name,
            "result": result,
            "signature": method_signature,
            "step": len(self.method_results)
        }
        
        self.method_results.append(result_info)
        
        # Análisis inteligente del resultado
        self._analyze_and_store_data(method_name, result)
        
        print(f"📦 Contexto actualizado por {method_name}")
        print(f"   Claves disponibles: {list(self.data.keys())}")
    
    def _analyze_and_store_data(self, method_name: str, result: Any):
        """Analiza el resultado y extrae datos útiles automáticamente"""
        
        if isinstance(result, dict):
            self._extract_from_dict(method_name, result)
        elif isinstance(result, list):
            self._extract_from_list(method_name, result)
        elif isinstance(result, str):
            self._extract_from_string(method_name, result)
        
        # Almacenar resultado completo con prefijo del método
        self.data[f"{method_name}_result"] = result
    
    
    
    def _extract_from_dict(self, method_name: str, data: dict):
        """Extrae datos útiles de un diccionario con prioridad en content/body"""
        
        # Buscar listas de objetos con IDs
        for key, value in data.items():
            if isinstance(value, list) and value:
                # Si es lista de diccionarios con 'id'
                if isinstance(value[0], dict) and 'id' in value[0]:
                    ids = [item['id'] for item in value if 'id' in item]
                    self.data[f"{key}_ids"] = ids
                    self.data[f"{method_name}_{key}_ids"] = ids
                    
                    # Almacenar también los objetos completos
                    self.data[f"{key}_data"] = value
                    self.data[f"{method_name}_{key}_data"] = value
            
            # Buscar IDs individuales
            elif 'id' in key.lower():
                self.data[f"{method_name}_id"] = value
                self.data[f"last_id"] = value
        
        # 🔥 PRIORIDAD: Buscar primero content/body (contenido real del documento/email)
        content_found = False
        for key, value in data.items():
            if key.lower() in ['content', 'body']:  # Solo estas claves principales
                self.data[f"{method_name}_content"] = value
                self.data[f"last_content"] = value
                content_found = True
                print(f"✅ Contenido principal detectado en clave '{key}' ({len(str(value))} caracteres)")
                break  # Salir inmediatamente para evitar sobrescritura
        
        # Si no se encontró content/body, buscar text o message como fallback
        if not content_found:
            for key, value in data.items():
                if key.lower() in ['text', 'message']:
                    self.data[f"{method_name}_content"] = value
                    self.data[f"last_content"] = value
                    print(f"ℹ️ Contenido alternativo detectado en clave '{key}' ({len(str(value))} caracteres)")
                    break

    
    def _extract_from_list(self, method_name: str, data: list):
        """Extrae datos útiles de una lista"""
        if not data:
            return
            
        # Si es lista de diccionarios
        if isinstance(data[0], dict):
            # Extraer IDs si existen
            if 'id' in data[0]:
                ids = [item['id'] for item in data if 'id' in item]
                self.data[f"{method_name}_ids"] = ids
                self.data[f"ids"] = ids
            
            # Almacenar lista completa
            self.data[f"{method_name}_list"] = data
        
        # Si es lista de strings/IDs
        elif isinstance(data[0], str):
            self.data[f"{method_name}_ids"] = data
    
    def _extract_from_string(self, method_name: str, data: str):
        """Extrae datos útiles de un string"""
        self.data[f"{method_name}_text"] = data
        self.data[f"last_text"] = data
    
    def resolve_parameter(self, param_name: str, param_type: str = None) -> Any:
        """Resuelve un parámetro basado en el contexto disponible"""
        
        # Búsqueda inteligente por nombre de parámetro
        resolution_strategies = [
            # Estrategia 1: Coincidencia exacta
            lambda: self.data.get(param_name),
            
            # Estrategia 2: Buscar IDs
            lambda: self._resolve_id_parameter(param_name),
            
            # Estrategia 3: Buscar por tipo/patrón
            lambda: self._resolve_by_pattern(param_name),
            
            # Estrategia 4: Último resultado relevante
            lambda: self._resolve_last_relevant(param_name)
        ]
        
        for strategy in resolution_strategies:
            result = strategy()
            if result is not None:
                print(f"🎯 Parámetro '{param_name}' resuelto: {result}")
                return result
        
        print(f"❌ No se pudo resolver parámetro '{param_name}'")
        return None
    
    def _resolve_id_parameter(self, param_name: str):
        """Resuelve parámetros que terminan en '_id'"""
        if not param_name.endswith('_id'):
            return None
        
        # Extraer el prefijo (ej: 'message_id' -> 'message')
        prefix = param_name[:-3]
        
        # Buscar IDs relacionados
        possible_keys = [
            f"{prefix}_ids",
            f"{prefix}s_ids",  # plural
            f"last_id",
            "ids"
        ]
        
        for key in possible_keys:
            if key in self.data:
                ids = self.data[key]
                if isinstance(ids, list) and ids:
                    return ids[0]  # Primer ID disponible
                elif isinstance(ids, str):
                    return ids
        
        return None
    
    def _resolve_by_pattern(self, param_name: str):
        """Resuelve por patrones comunes"""
        patterns = {
            'to': ['email', 'recipient', 'destination'],
            'subject': ['title', 'topic', 'asunto'],
            # 🔥 Fix: ahora 'body' prioriza el resultado del LLM
            'body': ['llm_result', 'content', 'message', 'text', 'description'],
            'content': ['body', 'text', 'message'],
            'query': ['search', 'term', 'keyword'],
            'max_results': [10, 5]  # valores por defecto
        }

        if param_name in patterns:
            for pattern in patterns[param_name]:
                if pattern in self.data:   # primero busca en llaves de self.data
                    return self.data[pattern]
                if isinstance(pattern, (str, int)):
                    if isinstance(pattern, int):
                        return pattern  # valor por defecto (ej: max_results)
        
        return None

    
    def _resolve_last_relevant(self, param_name: str):
        """Resuelve usando el último resultado relevante"""
        fallback_keys = [
            f"last_{param_name}",
            f"{param_name}_result",
            "last_content",
            "last_text"
        ]
        
        for key in fallback_keys:
            if key in self.data:
                return self.data[key]
        
        return None
    
    def needs_content_generation(self, param_value: str) -> bool:
        """Verifica si un parámetro necesita generación de contenido"""
        if not param_value:
            return False
        
        generation_triggers = [
            "dynamic", "auto", "generate", 
            "dynamic_summary", "auto_summary",
            "generate_content", "create_content"
        ]
        
        return any(trigger in str(param_value).lower() for trigger in generation_triggers)
    
    async def generate_content_if_needed(self, param_name: str, param_value: str, user_input: str):
        """Genera contenido automáticamente si es necesario"""
        if not self.needs_content_generation(param_value):
            return param_value
        
        print(f"🤖 Generando contenido para parámetro '{param_name}'...")
        generated_content = await self._generate_contextual_content(param_name, user_input)
        
        if generated_content:
            print(f"✨ Contenido generado para '{param_name}' (longitud: {len(generated_content)})")
            return generated_content
        
        return param_value
    
    async def _generate_contextual_content(self, param_name: str, user_input: str) -> str:
        """
        Genera contenido usando el LLM basándose en la necesidad del parámetro
        y la entrada original del usuario.
        
        NOTA: Para que esto funcione, la instancia de IntelligentContext
        debe tener acceso al servicio LLM (ej: self.llm_service).
        """
        
        # ⚠️ Verificación Crucial: Asegúrate de que el servicio LLM esté disponible
        if not hasattr(self, 'llm_service') or self.llm_service is None:
            # En un entorno real, levantarías una excepción o devolverías un error
            print("❌ ERROR: El servicio LLM no está conectado a IntelligentContext.")
            return f"Error: LLM service not available for dynamic content generation of '{param_name}'."

        # 1. Definir el prompt de generación
        # Este prompt le dice al LLM qué hacer. Usaremos la entrada original del usuario
        # para darle contexto.
        
        if param_name == 'body':
            prompt_instruction = (
                "Genera un cuerpo de texto profesional, completo y persuasivo "
                "basado en la siguiente solicitud del usuario. Tu respuesta debe ser "
                "SOLO el cuerpo del texto, sin introducción ni metadatos: "
            )
        elif param_name == 'subject':
            prompt_instruction = (
                "Genera un asunto de correo conciso, atractivo y profesional "
                "basado en la siguiente solicitud del usuario. Tu respuesta debe ser "
                "SOLO el asunto del texto, sin introducción ni metadatos: "
            )
        else:
            # Generación genérica para otros parámetros dinámicos
            prompt_instruction = (
                f"Genera contenido para el parámetro '{param_name}' basado en el contexto. "
                "Tu respuesta debe ser SOLAMENTE el valor de contenido generado: "
            )
        
        full_prompt = f"{prompt_instruction}\n\n[SOLICITUD DEL USUARIO]: {user_input}"
        
        # 2. Llamada al servicio LLM (Asumiendo que self.llm_service tiene un método 'generate')
        try:
            # 💡 NOTA: La forma exacta de llamar al LLM depende de tu SDK
            generated_content = await call_llm(full_prompt)
            
            # 3. Limpieza de salida (opcional, pero recomendada)
            return generated_content.strip()

        except Exception as e:
            print(f"❌ Error durante la generación LLM para '{param_name}': {e}")
            return f"Error al generar contenido LLM: {param_name}"
    
    
    
    