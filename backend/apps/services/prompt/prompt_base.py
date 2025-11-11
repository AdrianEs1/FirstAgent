"""
prompt_base.py
Base centralizada para la generación de prompts de planificación y selección
de métodos en herramientas multi-servicio (Drive, Gmail, etc.).
"""

import json
from typing import List, Dict, Union

# ======================================================
# 🌍 REGLAS GLOBALES COMPARTIDAS
# ======================================================

GLOBAL_RULES = """
    GENERAL RULES (ENGLISH, for precision):
    - Always respond with a valid JSON object.
    - Never include Markdown, backticks, or commentary.
    - Do not invent or modify method names.
    - Only use arguments that appear in the provided signature.
    - Never include "user_id" unless explicitly mentioned.
    - All dynamic content placeholders should be written as "dynamic".
    - Keep the JSON clean, well-formatted, and minimal.

    REGLAS GENERALES (ESPAÑOL, para contexto humano):
    - Devuelve ÚNICAMENTE JSON válido, sin texto adicional.
    - No inventes nombres de métodos ni parámetros.
    - Si el usuario pide contenido (correo, resumen, texto), genera texto natural completo.
    - Evita incluir `html=True` u otros flags no soportados.
    - No uses comillas invertidas (backticks).
    """

# ======================================================
# 🧠 PLANTILLAS ESPECÍFICAS POR TIPO DE TAREA
# ======================================================

def get_prompt_template(task_type: str) -> str:
    """
    Devuelve la plantilla base según el tipo de tarea.
    """
    if task_type == "simple":
        return """
        You are selecting a SINGLE method that best satisfies the user's request.

        RULES:
        1. Select only ONE method from the available list.
        2. Only include valid parameters from the method signature.
        3. If the user asks for a count (e.g., "3 emails"), use that number.
        4. For email-type methods: valid params are to, subject, body.
        5. If HTML is mentioned, include actual <h1>, <p>, etc. tags.
        6. Use "dynamic" for values generated later by the system.
        7. Never use markdown, backticks, or explanations.

        EXAMPLES:
        ✅ "list my last 3 emails" → {{"method": "list_emails", "args": {{"max_results": 3}}}}
        ✅ "send email to juan@test.com" → {{"method": "send_email", "args": {{"to": "juan@test.com", "subject": "Hola", "body": "dynamic"}}}}
        ✅ "test connection" → {{"method": "test_connection", "args": {{}}}}

        Respond ONLY with valid JSON:
        {{"method": "selected_method", "args": {{"param": "value"}}}}
        """

    elif task_type == "complex":
      return """
        You are planning a COMPLEX task that may require reading, processing and then generating
        detailed content using an LLM. The output MUST be a valid JSON object (no markdown, no backticks).

        GUIDELINES:
        1. Prefer a short SEQUENCE of steps instead of a single call when the user requests analysis
          or summarization of a file. Typical flow: find file → read file → LLM summarizes/analyzes.
        2. Use only methods present in AVAILABLE METHODS. Do not invent method names or args.
        3. When you need file content, include a step with {"method": "read_file", "args": {"file_id": "<id|dynamic>"}}.
          If the plan discovers the file by name first, use list_files then read_file with file_id="dynamic".
        4. Use an LLM reasoning step for generation: {"action":"llm", "task":"<instructions for generation>"}.
          The LLM step should receive the extracted content (resolved at runtime) and produce the final user-facing text.
        5. If the user requested a structured summary (e.g. "tema, resumen, recomendaciones"), instruct the LLM step to
          return the final content in that exact structure and language.
        6. Do NOT use "dynamic" for fields that must be produced by the LLM itself — instead, put those instructions into the "task".
        7. Always return JSON only. Do not add commentary or explanatory text.
        8. When searching files in Google Drive, ALWAYS use "name contains" instead of "name ="
           unless the user explicitly gives the full exact name including extension.
           Example: {"method": "list_files", "args": {"query": "name contains 'report'"}}.
        


        EXAMPLE FLOWS (use these patterns when appropriate):

        — If file name must be located then summarized:
        {
          "sequence": [
            {"method": "list_files", "args": {"query": "name contains 'acta_matricula'"}},
            {"method": "read_file", "args": {"file_id": "dynamic"}},
            {"action": "llm", "task": "Given the file content, produce a structured summary with sections: Tema, Resumen del contenido, Recomendaciones. Use Spanish."}
          ]
        }

        — If file_id is known:
        {
          "sequence": [
            {"method": "read_file", "args": {"file_id": "1A2b..."}},
            {"action": "llm", "task": "Summarize the provided content into: Tema, Resumen del contenido, Recomendaciones (in Spanish)."}
          ]
        }

        OUTPUT FORMAT REQUIRED:
        Return exactly one JSON object with key "sequence". Each element must be either:
        - a method call: {"method":"<name>", "args":{ ... }}
        - an LLM step: {"action":"llm", "task":"<clear generation instructions>"}

        Remember: NO backticks, NO markdown, ONLY valid JSON.
        """


    elif task_type == "multi_tool":
        
        return """
        You are planning a SEQUENCE of multiple method calls from this tool.

        RULES:
        1. Use only existing methods from the provided list.
        2. No invented method names or parameters.
        3. Use "dynamic" for values resolved later by context.
        4. You may include LLM tasks using {"action": "llm", "task": "specific description"}.
        5. Logical order: fetch data → process → act.
        6. Do not use markdown or backticks.
        7. Keep the sequence concise and goal-oriented.
        8. When generating Drive queries, prefer "name contains '<keyword>'" instead of "name = '<keyword>'" unless the user specifies the full filename with its extension.


        EXAMPLES:
        {{
          "sequence": [
            {{"method": "list_files", "args": {{"query": "type='pdf'"}}}},
            {{"action": "llm", "task": "summarize extracted files"}},
            {{"method": "upload_file", "args": {{"name": "summary.txt", "content": "dynamic"}}}}
          ]
        }}
        """

    else:
        return """
        Unknown task type. Defaulting to simple behavior.
        Respond with valid JSON only.
        {{"method": "default_action", "args": {{}}}}
        """


# ======================================================
# 🏗️ CONSTRUCTOR PRINCIPAL DEL PROMPT
# ======================================================

def build_prompt(tool_name: Union[str, List[str]], methods: List[Dict], user_input: str, task_type: str) -> str:
    """
    Construye dinámicamente el prompt completo para el modelo de lenguaje,
    soportando una o múltiples herramientas.
    """
    # 🔹 1️⃣ Normalizar herramienta(s)
    if isinstance(tool_name, list):
        tool_section = "Herramientas disponibles:\n" + "\n".join([f"- {t}" for t in tool_name])
    else:
        tool_section = f"Herramienta: {tool_name}"

    # 🔹 2️⃣ Convertir métodos a texto legible
    methods_info = json.dumps(methods, indent=2, ensure_ascii=False)

    # 🔹 3️⃣ Plantilla específica según tipo de tarea (simple / complex / multi_tool)
    template = get_prompt_template(task_type)

    # 🔹 4️⃣ Agregar instrucción especial si el tipo es multi_tool
    multi_tool_note = ""
    if task_type == "multi_tool":
        multi_tool_note = """
        ⚙️ INSTRUCCIÓN ESPECIAL:
        - Puedes combinar métodos de distintas herramientas para resolver la petición del usuario.
        - Cada paso del plan debe incluir el campo `"tool"` con el nombre de la herramienta a usar.
        - Ejemplo de estructura válida:
          {
            "sequence": [
              {"tool": "gmail", "method": "list_emails", "args": {"label": "inbox"}},
              {"tool": "drive", "method": "upload_file", "args": {"file_path": "attachments.zip"}},
              {"action": "llm", "task": "summarize uploaded content"}
            ]
          }
        """

    # 🔹 5️⃣ Prompt final unificado
    return f"""
    === CONTEXTO ===
    {tool_section}
    User request: "{user_input}"

    === MÉTODOS DISPONIBLES ===
    {methods_info}

    === REGLAS GLOBALES ===
    {GLOBAL_RULES}

    === INSTRUCCIONES ESPECÍFICAS ({task_type.upper()}) ===
    {template}
    {multi_tool_note}

    Responde ÚNICAMENTE con un objeto JSON válido siguiendo la estructura anterior.
    """



def get_decision_prompt(user_input: str, context: str, available_tools: list) -> str:
    """
    Clasificador de intención refinado y agnóstico.
    Detecta el tipo de tarea y las herramientas estrictamente necesarias
    basándose en las descripciones de las herramientas disponibles.
    """

    # 🔹 Normalizar available_tools (soporta strings o dicts)
    if available_tools and isinstance(available_tools[0], str):
        # Si llegan como strings, convertirlos a formato dict
        tools_list = [{"name": tool, "description": f"Handles {tool}-related operations"} 
                      for tool in available_tools]
    else:
        # Ya vienen como dicts con name y description
        tools_list = available_tools

    # Construir información dinámica de herramientas
    tools_description = "\n".join([
        f"- {tool['name']}: {tool.get('description', 'No description available')}"
        for tool in tools_list
    ]) if tools_list else "No tools available"

    return f"""
      SYSTEM ROLE:
      You are an intelligent orchestrator that classifies user requests based on intent and available tools.

      USER INPUT:
      "{user_input}"

      CONTEXT:
      {context}

      AVAILABLE TOOLS AND THEIR CAPABILITIES:
      {tools_description}

      === TASK TYPES ===
      🟢 simple → One direct action using a single method from one tool.
      🟡 complex → One reasoning or creative task that generates new content (LLM).
      🔵 multi_tool → Sequential actions involving DIFFERENT tools or multiple stages of reasoning.
      ⚪ conversation → General chat not requiring tools.

      === DECISION LOGIC (STRICT & AGNOSTIC) ===
      
      1️⃣ **Analyze the user request semantically**:
         - Identify the PRIMARY action requested (read, list, send, delete, create, analyze, etc.)
         - Identify the PRIMARY resource mentioned (file, email, document, folder, message, etc.)
         - Identify any SECONDARY actions (e.g., "find X and then send it via Y")

      2️⃣ **Match resources to tools**:
         - For EACH resource/action mentioned, determine which available tool handles it.
         - Use the tool descriptions to make this determination.
         - ONLY include a tool if the request explicitly requires its functionality.
         - DO NOT include a tool if:
           * The resource it handles is not mentioned in the request
           * The action it provides is not needed for the request
           * It's only vaguely related but not directly required

      3️⃣ **Determine task type**:
         - **simple**: One direct action using one tool (e.g., "list my files", "read email")
         - **complex**: Requires content generation/transformation with LLM (e.g., "summarize", "explain", "write")
         - **multi_tool**: Either:
           a) Uses multiple DIFFERENT tools (e.g., "read file and email it")
           b) Uses ONE tool in a sequence with LLM (e.g., "find file and summarize it")
         - **conversation**: General chat, no tools needed

      4️⃣ **Verification step** (CRITICAL):
         Before finalizing your response, ask yourself for EACH tool you're including:
         - "Is this tool's functionality EXPLICITLY required by the user's request?"
         - "Does the request mention a resource that ONLY this tool can handle?"
         - If the answer to BOTH questions is NO → REMOVE that tool from the list.

      === RESPONSE FORMAT (STRICT JSON) ===

      Return ONE of these formats based on the request:

      Case A - Single tool needed (MOST COMMON):
      {{
        "actions": ["tool_name"],
        "type": "simple" or "multi_tool"
      }}

      Case B - Multiple tools needed (RARE):
      {{
        "actions": ["tool_1", "tool_2"],
        "type": "multi_tool"
      }}

      Case C - No tools needed:
      {{
        "actions": [],
        "type": "conversation"
      }}

      === REASONING EXAMPLES (TOOL-AGNOSTIC) ===
      
      Example 1: "summarize the report.pdf file"
      Analysis:
      - PRIMARY action: summarize (requires LLM)
      - PRIMARY resource: file/document
      - Tool needed: whichever tool handles files (e.g., "drive")
      - NO other tools mentioned or implied
      Result: {{"actions": ["drive"], "type": "multi_tool"}}
      
      Example 2: "list my recent messages"
      Analysis:
      - PRIMARY action: list
      - PRIMARY resource: messages/emails
      - Tool needed: whichever tool handles messages (e.g., "gmail")
      - NO other tools mentioned or implied
      Result: {{"actions": ["gmail"], "type": "simple"}}
      
      Example 3: "find the budget file and send it to john@example.com"
      Analysis:
      - PRIMARY action: find (file) + send (email)
      - PRIMARY resources: file AND email
      - Tools needed: file handler (e.g., "drive") + email handler (e.g., "gmail")
      - BOTH tools are explicitly required
      Result: {{"actions": ["drive", "gmail"], "type": "multi_tool"}}
      
      Example 4: "read the document named 'proposal'"
      Analysis:
      - PRIMARY action: read
      - PRIMARY resource: document/file
      - Tool needed: whichever tool handles documents (e.g., "drive")
      - NO email, NO sending, NO other tools implied
      Result: {{"actions": ["drive"], "type": "simple"}}
      
      Example 5: "hello, how are you?"
      Analysis:
      - No specific action or resource mentioned
      - General conversation
      Result: {{"actions": [], "type": "conversation"}}

      === CRITICAL REMINDERS ===
      ⚠️ BE STRICT: Only include tools whose functionality is DIRECTLY required.
      ⚠️ DO NOT assume: If a tool isn't explicitly needed, don't include it.
      ⚠️ One resource = One tool: Unless the request mentions multiple distinct resources/actions.
      ⚠️ Output ONLY valid JSON. No markdown, no backticks, no commentary.
      """



# ======================================================
# ✅ EJEMPLO DE USO
# ======================================================
if __name__ == "__main__":
    test_prompt = build_prompt(
        tool_name="drive",
        methods=[
            {"name": "list_files", "signature": "(query: str = None, max_results: int = 10)", "description": "List Google Drive files"},
            {"name": "read_file", "signature": "(file_id: str)", "description": "Read content of a Drive file"},
            {"name": "upload_file", "signature": "(name: str, content: str)", "description": "Upload a file to Drive"},
        ],
        user_input="resume el archivo acta_matricula",
        task_type="multi_tool"
    )

    print(test_prompt)
