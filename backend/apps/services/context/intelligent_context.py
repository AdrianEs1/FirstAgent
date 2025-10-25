import json
from typing import Any



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
        """Extrae datos útiles de un diccionario"""
        
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
            
            # Buscar contenido de texto
            elif any(text_key in key.lower() for text_key in ['content', 'body', 'text', 'message']):
                self.data[f"{method_name}_content"] = value
                self.data[f"last_content"] = value
    
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
    
    async def _generate_contextual_content(self, param_name: str, user_input: str):
        """Genera contenido basado en el contexto actual"""
        if param_name in ['body', 'content', 'message', 'text']:
            return await self._generate_summary_content(user_input)
        elif param_name in ['subject', 'title']:
            return await self._generate_subject_content(user_input)
        
        return None
    
    async def _generate_summary_content(self, user_input: str):
        """Genera contenido de resumen basado en datos procesados"""
        if not self.method_results:
            return None
        
        # Recopilar datos procesados de forma inteligente
        processed_data = []
        email_content = None
        
        for result_info in self.method_results:
            method = result_info['method']
            result = result_info['result']
            
            if method == 'list_emails' and isinstance(result, dict):
                messages = result.get('messages', [])
                processed_data.append({
                    "type": "email_list",
                    "count": len(messages),
                    "messages": messages[:3]  # Solo los primeros 3 para el prompt
                })
                
            elif method == 'read_email' and isinstance(result, dict):
                if result.get('success'):
                    message = result.get('message', {})
                    email_content = {
                        "subject": next((h['value'] for h in message.get('payload', {}).get('headers', []) if h['name'] == 'Subject'), 'Sin asunto'),
                        "from": next((h['value'] for h in message.get('payload', {}).get('headers', []) if h['name'] == 'From'), 'Desconocido'),
                        "snippet": message.get('snippet', ''),
                        "date": next((h['value'] for h in message.get('payload', {}).get('headers', []) if h['name'] == 'Date'), 'Fecha desconocida')
                    }
                    processed_data.append({
                        "type": "email_content", 
                        "data": email_content
                    })
        
        if not processed_data:
            return "No se encontraron datos para generar el resumen."
        
        # Generar prompt optimizado
        generation_prompt = f"""
        SOLICITUD DEL USUARIO: "{user_input}"
        
        DATOS PROCESADOS: {json.dumps(processed_data, indent=2, ensure_ascii=False)}
        
        Genera respuesta SOLO en el formato solicitado:
        """
        
        try:
            from apps.services.llm.llm_service import call_llm
            html_content = await call_llm(generation_prompt)
            
            # Limpiar respuesta si viene con markdown
            if html_content.startswith('```html'):
                html_content = html_content.replace('```html', '').replace('```', '').strip()
            
            return html_content
            
        except Exception as e:
            print(f"❌ Error generando contenido: {e}")
            return f"""
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">Resumen de Emails</h2>
                <p>Se procesaron {len(self.method_results)} operaciones de email.</p>
                <p><em>Error generando contenido detallado: {str(e)}</em></p>
            </body>
            </html>
            """
    
    async def _generate_subject_content(self, user_input: str):
        """Genera asunto basado en el contexto"""
        email_count = len([r for r in self.method_results if r['method'] in ['list_emails', 'read_email']])
        
        if email_count > 0:
            return f"Resumen de tus últimos {email_count} emails - {user_input[:30]}..."
        
        return f"Resumen solicitado - {user_input[:40]}..."