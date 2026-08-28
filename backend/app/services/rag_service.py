import logging
import json
from typing import List, Dict, Any, Optional
from app.config import settings
from app.database import db_manager
from app.models.schemas import RAGQueryRequest, RAGQueryResponse, SourceCitation

logger = logging.getLogger(__name__)

NON_DIAGNOSTIC_NOTICE = (
    "Non-diagnostic notice: This AI assistant reads, retrieves, and summarizes your official doctor medical records. "
    "It does not diagnose conditions, prescribe medication, or alter doctor instructions. "
    "Always consult a qualified healthcare provider for clinical decisions."
)

class RAGService:
    @staticmethod
    async def process_user_query(request: RAGQueryRequest) -> RAGQueryResponse:
        """Retrieve relevant context from MongoDB Atlas for specified mobile_number and generate AI response."""
        query_text = request.query
        language = request.language or "English"
        mobile_number = request.mobile_number if request.mobile_number and request.mobile_number != "9876543210" else None

        # Fetch records from MongoDB Atlas
        documents = await db_manager.get_all_documents(mobile_number=mobile_number)
        medicines = await db_manager.get_all_medicines(mobile_number=mobile_number)
        lab_results = await db_manager.get_all_lab_results(mobile_number=mobile_number)
        
        # Build context from database
        context_snippets: List[str] = []
        citations: List[SourceCitation] = []

        # Build Medicines Context
        if medicines:
            med_lines = []
            for m in medicines:
                med_lines.append(
                    f"• {m.get('name')} (Dosage: {m.get('dosage')}, Timing: {m.get('timing')}, Frequency: {m.get('frequency')}) - Source: {m.get('filename')}"
                )
            context_snippets.append("RECORDED MEDICINES:\n" + "\n".join(med_lines))

        # Build Lab Results Context
        if lab_results:
            lab_lines = []
            for l in lab_results:
                lab_lines.append(
                    f"• {l.get('test_name')}: {l.get('value')} {l.get('unit')} (Ref Range: {l.get('reference_range')}, Status: {l.get('status')}) - Source: {l.get('filename')}"
                )
            context_snippets.append("RECORDED LAB TEST RESULTS:\n" + "\n".join(lab_lines))

        # Build Document Summary Context
        for doc in documents:
            ext = doc.get("extracted_data", {})
            doc_id = doc.get("id", "")
            filename = doc.get("filename", "Record")
            doc_type = doc.get("doc_type", "Record")
            upload_date = doc.get("upload_date", "")
            summary = doc.get("summary", "")

            # Doctor info & diagnoses
            doc_info = ext.get("doctor_info", {})
            diagnoses = ext.get("diagnoses", [])
            diag_str = ", ".join([d.get("condition_name", "") for d in diagnoses]) if diagnoses else "None listed"
            
            instructions = ext.get("doctor_instructions", [])
            inst_str = "; ".join([i.get("instruction", "") for i in instructions]) if instructions else "None listed"

            snippet_text = (
                f"Document '{filename}' ({doc_type}, Date: {upload_date}):\n"
                f"  Doctor: {doc_info.get('doctor_name')} ({doc_info.get('clinic_name')})\n"
                f"  Recorded Conditions: {diag_str}\n"
                f"  Summary: {summary}\n"
                f"  Doctor Advice: {inst_str}"
            )
            context_snippets.append(snippet_text)

            citations.append(
                SourceCitation(
                    document_id=doc_id,
                    filename=filename,
                    doc_type=doc_type,
                    upload_date=upload_date,
                    relevant_snippet=summary or snippet_text[:150]
                )
            )

        full_context_str = "\n\n".join(context_snippets) if context_snippets else "No previous medical documents uploaded yet."

        # If Gemini API key available, call LLM with RAG system prompt
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                
                system_prompt = f"""
You are a compassionate, context-aware AI Medical History Assistant.
Your primary role is to retrieve, organize, summarize, and explain the user's uploaded medical records (prescriptions, lab tests, discharge summaries).

TARGET LANGUAGE REQUIREMENT:
Generate your complete response in '{language}'. 
If language is 'Telugu', output natural, polite, medically accurate Telugu text (తెలుగు).
If language is 'Hindi', output natural Hindi text.

CONSTRAINTS & RULES:
1. Base your answer strictly on the provided medical records context.
2. DO NOT mention or print any mobile numbers or internal ID tags in your text.
3. Be clear, empathetic, and organized using bullet points where helpful.

PATIENT MEDICAL RECORDS CONTEXT FROM MONGODB ATLAS:
{full_context_str}
"""

                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[
                        system_prompt,
                        f"User Query: {query_text}"
                    ]
                )

                if response and response.text:
                    return RAGQueryResponse(
                        answer=response.text.strip(),
                        language=language,
                        sources=citations[:3],
                        non_diagnostic_disclaimer=NON_DIAGNOSTIC_NOTICE
                    )
            except Exception as e:
                logger.warning(f"Gemini RAG API call failed: {e}. Falling back to rule-based RAG responder.")

        # Heuristic fallback responder
        answer_text = RAGService._fallback_rag_response(query_text, language, documents, medicines, lab_results)
        
        return RAGQueryResponse(
            answer=answer_text,
            language=language,
            sources=citations[:3],
            non_diagnostic_disclaimer=NON_DIAGNOSTIC_NOTICE
        )

    @staticmethod
    def _fallback_rag_response(
        query: str, 
        language: str, 
        documents: List[dict], 
        medicines: List[dict], 
        lab_results: List[dict]
    ) -> str:
        q_lower = query.lower()
        is_telugu = language.lower() == "telugu" or "telugu" in q_lower or "తెలుగు" in query
        is_hindi = language.lower() == "hindi" or "hindi" in q_lower

        if "medicine" in q_lower or "drug" in q_lower or "tab" in q_lower or "prescription" in q_lower or "మందులు" in query:
            if not medicines:
                if is_telugu:
                    return "మీ వైద్య నివేదికలలో ఇంకా ఏ మందుల వివరాలు నమోదు కాలేదు. దయచేసి మీ ప్రిస్క్రిప్షన్ అప్‌లోడ్ చేయండి."
                return "No prescribed medicines found in your uploaded records. Please upload your latest prescription document."
            else:
                med_lines = []
                for m in medicines:
                    med_lines.append(f"• **{m.get('name')}** - {m.get('dosage')} ({m.get('timing')}, {m.get('frequency')}) [Source: {m.get('filename')}]")
                med_list_str = "\n".join(med_lines)

                if is_telugu:
                    return (
                        f"మీ వైద్య నివేదికల ప్రకారం మీరు ఉపయోగిస్తున్న మందుల వివరాలు:\n\n"
                        f"{med_list_str}\n\n"
                        f"గమనిక: ఏవైనా మార్పుల కోసం మీ డాక్టర్‌ను సంప్రదించండి."
                    )
                elif is_hindi:
                    return (
                        f"आपकी मेडिकल रिपोर्ट के अनुसार दर्ज दवाइयाँ:\n\n"
                        f"{med_list_str}"
                    )
                else:
                    return (
                        f"Here are the prescribed medicines recorded in your medical files:\n\n"
                        f"{med_list_str}\n\n"
                        f"Please consult your prescribing doctor before changing any dosage."
                    )

        elif "hba1c" in q_lower or "sugar" in q_lower or "glucose" in q_lower or "lab" in q_lower or "blood" in q_lower or "రక్త పరీక్ష" in query:
            hba1c_tests = [l for l in lab_results if "hba1c" in l.get("test_name", "").lower() or "glycated" in l.get("test_name", "").lower()]
            if hba1c_tests:
                latest = hba1c_tests[0]
                val = latest.get("value")
                unit = latest.get("unit", "%")
                status = latest.get("status", "")
                fn = latest.get("filename", "")
                
                if is_telugu:
                    return (
                        f"మీ తాజా **HbA1c** రక్త పరీక్ష ఫలితం **{val}{unit}** ({status}).\n"
                        f"మూల పత్రం: {fn}.\n\n"
                        f"వివరణ: HbA1c గత 3 నెలల సగటు రక్త చక్కెర స్థాయిని చూపుతుంది."
                    )
                elif is_hindi:
                    return (
                        f"आपकी नवीनतम **HbA1c** रिपोर्ट **{val}{unit}** ({status}) है।\n"
                        f"स्रोतः {fn}।"
                    )
                else:
                    return (
                        f"According to your lab reports ({fn}), your recorded **HbA1c level is {val}{unit}** ({status}).\n\n"
                        f"• Value: {val} {unit}\n"
                        f"• Reference Status: {status}\n"
                        f"• Diagnostic Range: Normal (< 5.7%), Prediabetes (5.7% - 6.4%), Diabetes (>= 6.5%)."
                    )
            else:
                if is_telugu:
                    return "మీ నివేదికలలో HbA1c పరీక్ష కనుగొనబడలేదు. దయచేసి మీ రక్త నివేదికను అప్‌లోడ్ చేయండి."
                return "No HbA1c test record found in your uploaded reports. Please upload your latest blood report."

        elif "condition" in q_lower or "diagnosis" in q_lower or "disease" in q_lower or "report" in q_lower:
            all_conditions = []
            for d in documents:
                ext = d.get("extracted_data", {})
                for diag in ext.get("diagnoses", []):
                    all_conditions.append(f"• **{diag.get('condition_name')}** ({diag.get('type', 'Recorded')}) - Document: {d.get('filename')}")
            
            cond_str = "\n".join(all_conditions) if all_conditions else "No specific diagnoses highlighted."
            
            if is_telugu:
                return f"మీ నివేదికల నుండి నమోదు చేయబడిన ఆరోగ్య వివరాలు:\n\n{cond_str}"
            return f"Here are the medical conditions recorded in your files:\n\n{cond_str}"

        elif "recommend" in q_lower or "doctor" in q_lower or "advice" in q_lower or "instruction" in q_lower:
            all_inst = []
            for d in documents:
                ext = d.get("extracted_data", {})
                for inst in ext.get("doctor_instructions", []):
                    all_inst.append(f"• **{inst.get('instruction')}** ({inst.get('category', 'Advice')}) - Document: {d.get('filename')}")
            
            inst_str = "\n".join(all_inst) if all_inst else "No special instructions logged."
            
            if is_telugu:
                return f"మీ నివేదికల ఆధారంగా డాక్టర్ ఇచ్చిన సూచనలు:\n\n{inst_str}"
            return f"Here are the instructions recommended by doctors:\n\n{inst_str}"

        else:
            doc_count = len(documents)
            med_count = len(medicines)
            lab_count = len(lab_results)
            
            if is_telugu:
                return (
                    f"నమస్కారం! ప్రస్తుతం **{doc_count}** పత్రాలు, **{med_count}** మందుల వివరాలు మరియు **{lab_count}** ల్యాబ్ పరీక్షలు నమోదు చేయబడ్డాయి.\n\n"
                    f"నేను మీ మందుల వివరాలు, HbA1c/రక్త పరీక్షల ఫలితాలు, మరియు డాక్టర్ సూచనలను తెలుగులో స్పష్టంగా వివరించగలను."
                )
            return (
                f"Hello! Analyzed medical history stored in MongoDB ({doc_count} documents, {med_count} prescribed medicines, {lab_count} lab parameters).\n\n"
                f"You can ask me questions like:\n"
                f"1. *What medicines am I taking?*\n"
                f"2. *What was my previous HbA1c?*\n"
                f"3. *What conditions are recorded in my reports?*\n"
                f"4. *What did my doctor recommend?*\n"
                f"5. *Explain my prescription in Telugu.*"
            )
