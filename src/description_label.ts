import { getOriginalAreaFrom, getTransformAreaFrom } from "./boxplotdata"
export const descrizioni_asseX = {
    "CONOSCENZE": "Le conoscenze preliminari possedute sono risultate sufficienti per la comprensione degli argomenti previsti nel programma d'esame?",
    "CARICO DI STUDIO": "Il carico di studio dell'insegnamento è proporzionato ai crediti assegnati?",
    "MATERIALE DIDATTICO": "Il materiale didattico (indicato e disponibile) è adeguato per lo studio della materia?",
    "MOD ESAME": "Le modalità di esame sono state definite in modo chiaro?",
    "SODDISFAZIONE": "E' complessivamente soddisfattə di com'è stato svolto questo insegnamento?",
    "ORARI": "Sono rispettati gli orari di svolgimento di lezioni, esercitazioni e altre attività didattiche?",
    "DOC STIMOLA": "Il docente stimola / motiva l'interesse verso la disciplina?",
    "DOC ESPONE": "Il docente espone gli argomenti in modo chiaro?",
    "ATT. INTEGRATIVE": "Le attività didattiche integrative (esercitazioni, tutorati, laboratori ...) sono utili all'apprendimento della materia?",
    "COERENZA": "L'insegnamento è stato svolto in modo coerente con quanto dichiarato sul sito Web del corso di studio?",
    "DOC REPERIBILE": "Il docente è reperibile per chiarimenti e spiegazioni?",
    "INTERESSE": "E' interessatə agli argomenti trattati nell'insegnamento?"
}

export function getDescriptionFromOriginalArea(area){
    return descrizioni_asseX[area]
}
export function getDescriptionFromTransformedArea(area){
    return descrizioni_asseX[getOriginalAreaFrom(area)]
}