const clean = s => String(s || '').replace(/\u0000/g, '').trim();

function fallback(text) {
  const sentences = clean(text).replace(/\s+/g, ' ').match(/[^.!?]+[.!?]?/g) || [];
  const important = sentences.filter(s => /(high|low|abnormal|positive|negative|elevated|reduced|increased|decreased|hemoglobin|glucose|cholesterol|creatinine|vitamin|pressure|impression|finding|reference range|body mass index|\bBMI\b)/i.test(s));
  const summary = (important.length ? important : sentences).slice(0, 4).join(' ').slice(0, 1500)
    || 'Text was extracted, but there was not enough readable content to create a useful summary.';
  // Keep fallback values conservative: only capture explicit label/value pairs with recognizable units.
  const values = [...clean(text).matchAll(/\b(Hemoglobin|HbA1c|Glucose|Fasting glucose|Total cholesterol|LDL cholesterol|HDL cholesterol|Triglycerides|Creatinine|Platelet count|WBC count|RBC count|TSH)\s*[:=-]\s*([<>]?\s*\d+(?:\.\d+)?\s*(?:mg\/dL|g\/dL|mmol\/L|%|\/µL|mIU\/L|ng\/mL|mmHg)?)/gi)]
    .slice(0, 10).map(m => `${m[1].trim()}: ${m[2].trim()}`);
  return {
    summary,
    keyFindings: important.slice(0, 6).map(s => s.trim()),
    values,
    terms: [],
    questions: [
      'Which findings in this report are most relevant to my health?',
      'Are any reported measurements outside the laboratory reference ranges?',
      'Do I need any follow-up tests or an appointment to discuss these results?'
    ],
    disclaimer: 'Automated text-extraction summary only. It is not a diagnosis. Review the original report with a qualified healthcare professional.',
    provider: 'Local fallback (no LLM)'
  };
}

function asStringArray(value, max = 8) {
  return Array.isArray(value) ? value.map(v => String(v || '').trim()).filter(Boolean).slice(0, max) : [];
}

export async function analyzeReport(text) {
  const source = clean(text).slice(0, 18000);
  if (!source) throw new Error('No readable text found. Try a text-based PDF, DOCX or TXT file.');

  const base = fallback(source);
  const endpoint = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
  const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  const prompt = `You are MediMind, a careful medical-document explainer for the general public. Read the document and return a useful explanation in plain, simple English.\n\nSAFETY AND ACCURACY RULES:\n- Do not diagnose, prescribe, recommend medication changes, or claim that a person has a disease.\n- Never invent patient details, measurements, units, reference ranges, dates, or conclusions.\n- Preserve every number and unit exactly when quoting the document. If a value or unit is unclear, say it is unclear.\n- Distinguish an individual patient's laboratory report from a research paper, population survey, guideline, or educational document. If it is a research/population document, explicitly say its statistics describe a group and are NOT this user's personal test results.\n- Only call a laboratory result high/low/abnormal when the report itself marks it that way or provides a reference range that clearly supports that wording.\n- Do not turn demographic information, dates, IDs, sample counts, or page numbers into medical test results.\n\nOUTPUT RULES:\n1. summary: 2-4 concise sentences. Explain what kind of document it is and its main message. Avoid copying long passages.\n2. keyFindings: 3-6 distinct, important points. Do not repeat the summary word-for-word. For research documents, describe study/population findings rather than personal diagnoses.\n3. values: up to 10 clearly labelled medical measurements or important study metrics that genuinely appear in the document, preserving units. Do not include IDs, dates, or unrelated numbers. If none are clearly identifiable, return [].\n4. terms: provide 3-8 short explanations of important medical, health, or scientific terms that actually appear in the document. Each item must be {"term":"...","explanation":"..."}. Do not return an empty array if the document contains explainable terms such as BMI, cholesterol, HDL, LDL, hemoglobin, prevalence, or waist circumference. Do not invent terms absent from the document.\n5. questions: provide 3 useful questions the reader could ask a healthcare professional or, for a research document, questions that help them understand the study.\n6. disclaimer: one short sentence explaining that this is informational, may be incomplete, and is not a substitute for professional advice.\n\nReturn ONLY valid JSON with exactly these keys: summary (string), keyFindings (array of strings), values (array of strings), terms (array of objects with term and explanation), questions (array of strings), disclaimer (string).\n\nDOCUMENT TEXT:\n${source}`;

  try {
    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json',
        options: { temperature: 0.1, num_ctx: 8192 }
      }),
      signal: AbortSignal.timeout(120000)
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const data = await response.json();
    const parsed = JSON.parse(data.response || '{}');
    const terms = Array.isArray(parsed.terms)
      ? parsed.terms.map(item => ({
          term: String(item?.term || '').trim(),
          explanation: String(item?.explanation || '').trim()
        })).filter(item => item.term && item.explanation).slice(0, 8)
      : [];

    return {
      summary: String(parsed.summary || base.summary),
      keyFindings: asStringArray(parsed.keyFindings, 6).length ? asStringArray(parsed.keyFindings, 6) : base.keyFindings,
      values: asStringArray(parsed.values, 10),
      terms,
      questions: asStringArray(parsed.questions, 5).length ? asStringArray(parsed.questions, 5) : base.questions,
      disclaimer: String(parsed.disclaimer || 'This explanation is informational, may be incomplete, and is not a substitute for professional medical advice.'),
      provider: `Local Ollama · ${model}`
    };
  } catch (error) {
    console.error('MediMind Ollama analysis failed; using fallback:', error.message);
    return base;
  }
}
